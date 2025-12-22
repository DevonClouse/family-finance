from typing import List, Dict, Any
from .models import ProjectionRequest, AmortizationRequest, Strategy

class FinancialCalculator:
    
    @staticmethod
    def calculate_pmt(principal: float, annual_rate: float, years: int) -> float:
        if principal == 0 or annual_rate == 0:
            return 0
        r = (annual_rate / 100) / 12
        n = years * 12
        return (principal * r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)

    @staticmethod
    def generate_amortization_schedule(data: AmortizationRequest) -> List[Dict[str, Any]]:
        balance_baseline = data.mortgageBalance
        balance_accelerated = data.mortgageBalance
        r = (data.interestRate / 100) / 12
        
        if data.monthlyPayment <= data.mortgageBalance * r:
            return []

        result_data = [{"x": 0, "baseline": data.mortgageBalance, "accelerated": data.mortgageBalance}]
        
        month = 0
        while (balance_baseline > 0 or balance_accelerated > 0) and month < 360 * 2:
            month += 1
            
            # Baseline
            if balance_baseline > 0:
                interest = balance_baseline * r
                principal = data.monthlyPayment - interest
                balance_baseline = max(0, balance_baseline - principal)
                
            # Accelerated
            if balance_accelerated > 0:
                interest = balance_accelerated * r
                principal = data.monthlyPayment + data.extraPrincipalMonthly - interest
                balance_accelerated = max(0, balance_accelerated - principal)
                
            if month % 6 == 0 or balance_baseline == 0 or balance_accelerated == 0:
                result_data.append({
                    "x": month, 
                    "baseline": round(balance_baseline, 2), 
                    "accelerated": round(balance_accelerated, 2)
                })
                
            if balance_baseline == 0 and balance_accelerated == 0:
                break
                
        return result_data

    @staticmethod
    def generate_projections(data: ProjectionRequest) -> Dict[str, Any]:
        chart_data = []
        snapshots_map = {
            year: {"year": year, "buckets": {}, "baselineValue": 0, "totalValue": 0} 
            for year in data.projectionYears
        }
        
        initial_net_worth = 0
        
        # 1. Setup Investment Buckets
        active_buckets = []
        for b in data.contributions:
            start_bal = b.startingBalance if b.startingBalance else 0
            initial_net_worth += start_bal
            
            strats = data.strategies.get(str(b.id), [
                Strategy(id='default', name='Default', allocation=100, returnRate=5, reinvest=True)
            ])
            
            for s in strats:
                s.principal = start_bal * (s.allocation / 100)
                s.basePrincipal = start_bal * (s.allocation / 100)
                s.totalCashFlow = 0
                
            active_buckets.append({"info": b, "strategies": strats})

        # 2. Setup Properties
        properties = []
        if data.homeData:
            hd = data.homeData
            initial_net_worth += (hd.homeValue - hd.mortgageBalance)
            properties.append({
                "type": "primary", "id": "primary", "name": "Primary Home",
                "val": hd.homeValue, "debt": hd.mortgageBalance,
                "valBase": hd.homeValue, "debtBase": hd.mortgageBalance,
                "interestRate": hd.interestRate, "appreciationRate": hd.appreciationRate,
                "monthlyPayment": hd.monthlyPayment, "linkedBucketId": hd.linkedBucketId
            })
            
        for r in data.rentals:
            initial_net_worth += (r.value - r.mortgageBalance)
            properties.append({
                "type": "rental", "id": r.id, "name": r.name,
                "val": r.value, "debt": r.mortgageBalance,
                "valBase": r.value, "debtBase": r.mortgageBalance,
                "interestRate": r.interestRate, "appreciationRate": r.appreciationRate,
                "monthlyPayment": r.monthlyPayment, "linkedBucketId": r.linkedBucketId
            })

        chart_data.append({"x": 0, "baseline": round(initial_net_worth), "accelerated": round(initial_net_worth)})

        # --- Simulation Loop ---
        for y in range(1, 26):
            yearly_total = 0
            yearly_base = 0
            
            # Investments
            for bucket in active_buckets:
                for s in bucket["strategies"]:
                    contrib = bucket["info"].annualAmount * (s.allocation / 100)
                    s.principal += contrib
                    
                    growth = s.principal * (s.returnRate / 100)
                    base_growth = s.basePrincipal * (s.returnRate / 100)
                    
                    if s.reinvest:
                        s.principal += growth
                        s.basePrincipal += base_growth
                    else:
                        s.totalCashFlow += growth
                    
                    yearly_total += s.principal
                    yearly_base += s.basePrincipal

            # Properties
            for p in properties:
                rate = (p["interestRate"] / 100) / 12
                appreciation = (p["appreciationRate"]) / 100
                payment = p["monthlyPayment"]
                
                linked = next((ba for ba in data.bucketAllocations if ba.id == p["linkedBucketId"]), None)
                extra = linked.monthlyAmount if linked else 0
                
                p["val"] = p["val"] * (1 + appreciation)
                p["valBase"] = p["valBase"] * (1 + appreciation)
                
                for _ in range(12):
                    if p["debt"] > 0:
                        interest = p["debt"] * rate
                        princ = (payment + extra) - interest
                        p["debt"] = max(0, p["debt"] - princ)
                    
                    if p["debtBase"] > 0:
                        interest_base = p["debtBase"] * rate
                        princ_base = payment - interest_base
                        p["debtBase"] = max(0, p["debtBase"] - princ_base)
                
                equity = max(0, p["val"] - p["debt"])
                equity_base = max(0, p["valBase"] - p["debtBase"])
                
                yearly_total += equity
                yearly_base += equity_base

            chart_data.append({"x": y, "baseline": round(yearly_base), "accelerated": round(yearly_total)})
            
            if y in snapshots_map:
                snap = snapshots_map[y]
                snap["totalValue"] = round(yearly_total)
                snap["baselineValue"] = round(yearly_base)
                
                for bucket in active_buckets:
                    b_id = bucket["info"].id
                    total_b = sum(s.principal for s in bucket["strategies"])
                    base_b = sum(s.basePrincipal for s in bucket["strategies"])
                    cf_b = sum(s.totalCashFlow for s in bucket["strategies"])
                    snap["buckets"][b_id] = {
                        "name": bucket["info"].name,
                        "portfolioValue": round(total_b),
                        "baseValue": round(base_b),
                        "totalCashFlow": round(cf_b)
                    }
                
                for p in properties:
                    key = "primary-home" if p["type"] == "primary" else f"rental-{p['id']}"
                    name_display = "Primary Home Equity" if p["type"] == "primary" else f"{p['name']} (Equity)"
                    snap["buckets"][key] = {
                        "name": name_display,
                        "portfolioValue": round(max(0, p["val"] - p["debt"])),
                        "baseValue": round(max(0, p["valBase"] - p["debtBase"])),
                        "totalCashFlow": 0
                    }

        return {
            "snapshots": list(snapshots_map.values()),
            "chartData": chart_data
        }