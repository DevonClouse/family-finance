import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Wallet, Home, TrendingUp } from 'lucide-react';
import { api } from './services/api';
import { Modal, calculatePMT } from './components/UI';
import { PayoffAnalysis } from './components/Charts';

import DashboardView from './views/DashboardView';
import BudgetView from './views/BudgetView';
import RealEstateView from './views/RealEstateView';
import ProjectionsView from './views/ProjectionsView';

export default function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [viewMode, setViewMode] = useState('monthly');

    // --- Data State ---
    const [incomes, setIncomes] = useState([
        { id: 1, name: 'Salary', amount: 5000, frequency: 'monthly' }
    ]);

    const [buckets, setBuckets] = useState([
        { id: 1, name: 'Rent/Mortgage', type: 'spend', allocationType: 'flat', value: 2000, startingBalance: 0 },
        { id: 2, name: 'Groceries', type: 'spend', allocationType: 'flat', value: 600, startingBalance: 0 },
        { id: 3, name: 'Extra Principal', type: 'invest', allocationType: 'flat', value: 200, startingBalance: 0 },
        { id: 4, name: 'Stock Portfolio', type: 'invest', allocationType: 'percent', value: 50, startingBalance: 15000 },
        { id: 5, name: 'Fun Money', type: 'spend', allocationType: 'percent', value: 50, startingBalance: 0 },
        { id: 6, name: '401k', type: 'invest', allocationType: 'percent', value: 0, startingBalance: 45000 },
        { id: 7, name: 'Roth IRA', type: 'invest', allocationType: 'percent', value: 0, startingBalance: 12000 }
    ]);

    const [strategies, setStrategies] = useState({
        4: [
            { id: 's1', name: 'S&P 500 ETF', allocation: 80, returnRate: 8, reinvest: true },
            { id: 's2', name: 'Dividend Stocks', allocation: 20, returnRate: 4, reinvest: false }
        ]
    });

    const [homeData, setHomeData] = useState({
        homeValue: 450000,
        mortgageBalance: 350000,
        interestRate: 6.5,
        appreciationRate: 3.0,
        monthlyPayment: 2212,
        linkedBucketId: 3,
        term: 30
    });

    const [rentals, setRentals] = useState([
        {
            id: 101,
            name: 'Downtown Condo',
            value: 250000,
            mortgageBalance: 180000,
            interestRate: 7.0,
            monthlyPayment: 1197,
            rent: 1800,
            expenseRatio: 40,
            linkedBucketId: -1,
            appreciationRate: 3.0,
            term: 30
        }
    ]);

    // --- Async Data State (From Backend) ---
    const [amortizationData, setAmortizationData] = useState([]);
    const [projections, setProjections] = useState([]);
    const [projectionChartData, setProjectionChartData] = useState([]);

    // Drill Down Modal State
    const [analysisItem, setAnalysisItem] = useState(null);
    const [analysisAmortization, setAnalysisAmortization] = useState([]);

    // --- Client-Side Calculations ---

    const totalRentalCashFlow = useMemo(() => {
        return rentals.reduce((acc, r) => {
            const expenses = r.rent * (r.expenseRatio / 100);
            const net = r.rent - expenses - r.monthlyPayment;
            return acc + (viewMode === 'monthly' ? net : net * 12);
        }, 0);
    }, [rentals, viewMode]);

    const totalIncome = useMemo(() => {
        const salaryIncome = incomes.reduce((acc, inc) => {
            let monthlyAmount = inc.frequency === 'monthly' ? parseFloat(inc.amount) : parseFloat(inc.amount) / 12;
            return acc + (viewMode === 'monthly' ? monthlyAmount : monthlyAmount * 12);
        }, 0);
        return salaryIncome + totalRentalCashFlow;
    }, [incomes, totalRentalCashFlow, viewMode]);

    const bucketAllocations = useMemo(() => {
        let allocated = 0;

        // 1. Process Flat Rate
        const processedBuckets = buckets.map(b => {
            let amount = 0;
            let rawValue = parseFloat(b.value) || 0;
            if (b.allocationType === 'flat') {
                amount = viewMode === 'yearly' ? rawValue * 12 : rawValue;
                allocated += amount;
                return {
                    ...b,
                    calculatedAmount: amount,
                    shareOfTotal: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
                };
            }
            return b;
        });

        const effectiveIncome = Math.max(0, totalIncome);
        const remainder = Math.max(0, effectiveIncome - allocated);

        // 2. Process Percentage
        return processedBuckets.map(b => {
            if (b.allocationType === 'percent') {
                const pct = parseFloat(b.value) || 0;
                const amount = (pct / 100) * remainder;
                return {
                    ...b,
                    calculatedAmount: amount,
                    shareOfTotal: effectiveIncome > 0 ? (amount / effectiveIncome) * 100 : 0
                };
            }
            return b;
        });
    }, [buckets, totalIncome, viewMode]);

    const totalAllocated = bucketAllocations.reduce((sum, b) => sum + b.calculatedAmount, 0);
    const unallocated = totalIncome - totalAllocated;

    // --- Dashboard Stats Logic ---
    const dashboardStats = useMemo(() => {
        // 1. Assets
        const investBuckets = buckets.filter(b => b.type === 'invest');
        const investAssets = investBuckets.reduce((sum, b) => sum + (b.startingBalance || 0), 0);
        const primaryHomeValue = homeData.homeValue || 0;
        const rentalAssets = rentals.reduce((sum, r) => sum + (r.value || 0), 0);
        const totalAssets = investAssets + primaryHomeValue + rentalAssets;

        // 2. Liabilities
        const primaryMortgage = homeData.mortgageBalance || 0;
        const rentalLiabilities = rentals.reduce((sum, r) => sum + (r.mortgageBalance || 0), 0);
        const totalLiabilities = primaryMortgage + rentalLiabilities;

        // 3. Net Worth
        const netWorth = totalAssets - totalLiabilities;

        // 4. Monthly Flow Overview (Standardized to Monthly)
        const monthlyIncomeTotal = viewMode === 'monthly' ? totalIncome : totalIncome / 12;

        const spendBuckets = bucketAllocations.filter(b => b.type === 'spend');
        const spendFlow = spendBuckets.reduce((sum, b) => sum + (viewMode === 'monthly' ? b.calculatedAmount : b.calculatedAmount / 12), 0);

        const primaryPayment = homeData.monthlyPayment || 0;
        const rentalPayments = rentals.reduce((sum, r) => sum + (r.monthlyPayment || 0), 0);
        const rentalExpenses = rentals.reduce((sum, r) => sum + (r.rent * (r.expenseRatio / 100)), 0);

        const monthlyBurn = spendFlow + primaryPayment + rentalPayments + rentalExpenses;

        const pieData = [
            { label: 'Real Estate Equity', value: Math.max(0, (primaryHomeValue + rentalAssets) - totalLiabilities), color: '#3b82f6' },
            ...investBuckets.map((b, i) => ({
                label: b.name,
                value: b.startingBalance || 0,
                color: ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'][i % 5]
            }))
        ].filter(d => d.value > 0);

        return {
            netWorth,
            totalAssets,
            totalLiabilities,
            monthlyIncome: monthlyIncomeTotal,
            monthlyBurn,
            investBuckets,
            pieData,
            realEstateEquity: Math.max(0, (primaryHomeValue + rentalAssets) - totalLiabilities)
        };
    }, [buckets, bucketAllocations, homeData, rentals, totalIncome, viewMode]);


    // --- Effects (API Calls) ---

    // 1. Amortization for Primary Home
    useEffect(() => {
        const load = async () => {
            const linkedBucket = bucketAllocations.find(b => b.id === homeData.linkedBucketId);
            const extra = linkedBucket ? (viewMode === 'monthly' ? linkedBucket.calculatedAmount : linkedBucket.calculatedAmount / 12) : 0;

            const data = await api.calculateAmortization({ ...homeData, extraPrincipalMonthly: extra });
            setAmortizationData(data);
        };
        load();
    }, [homeData, bucketAllocations, viewMode]);

    // 2. Amortization for Drill Down Modal
    useEffect(() => {
        if (!analysisItem) return;
        const load = async () => {
            const linkedBucket = bucketAllocations.find(b => b.id === analysisItem.linkedBucketId);
            const extra = linkedBucket ? (viewMode === 'monthly' ? linkedBucket.calculatedAmount : linkedBucket.calculatedAmount / 12) : 0;

            const data = await api.calculateAmortization({ ...analysisItem, extraPrincipalMonthly: extra });
            setAnalysisAmortization(data);
        };
        load();
    }, [analysisItem, bucketAllocations, viewMode]);

    // 3. Projections
    useEffect(() => {
        const load = async () => {
            const normalizedAllocations = bucketAllocations.map(b => ({
                id: b.id,
                monthlyAmount: viewMode === 'monthly' ? b.calculatedAmount : b.calculatedAmount / 12
            }));

            const contributions = bucketAllocations.filter(b => b.type === 'invest').map(b => ({
                id: b.id,
                name: b.name,
                annualAmount: viewMode === 'monthly' ? b.calculatedAmount * 12 : b.calculatedAmount,
                startingBalance: b.startingBalance
            }));

            const payload = {
                contributions,
                strategies,
                projectionYears: [5, 10, 15, 20, 25],
                homeData,
                rentals,
                bucketAllocations: normalizedAllocations
            };

            const data = await api.calculateProjections(payload);

            if (data && data.snapshots) {
                setProjections(data.snapshots);
                setProjectionChartData(data.chartData);
            } else {
                // Optional: handle error state or keep previous data
                console.warn("Could not calculate projections");
            }
        };
        load();
    }, [bucketAllocations, strategies, homeData, rentals, viewMode]);

    // --- Handlers ---

    const addIncome = () => setIncomes([...incomes, { id: Date.now(), name: 'New Income', amount: 0, frequency: 'monthly' }]);
    const updateIncome = (id, field, val) => setIncomes(incomes.map(i => i.id === id ? { ...i, [field]: val } : i));
    const removeIncome = (id) => setIncomes(incomes.filter(i => i.id !== id));

    const addBucket = () => setBuckets([...buckets, { id: Date.now(), name: 'New Bucket', type: 'spend', allocationType: 'percent', value: 0, startingBalance: 0 }]);
    const updateBucket = (id, field, val) => setBuckets(buckets.map(b => b.id === id ? { ...b, [field]: val } : b));
    const removeBucket = (id) => setBuckets(buckets.filter(b => b.id !== id));

    const updateHomeData = (field, val) => {
        let newData = { ...homeData, [field]: val };
        // Auto-calculate payment if term, rate, or balance changes
        if (field === 'term' || field === 'mortgageBalance' || field === 'interestRate') {
            const pmt = calculatePMT(newData.mortgageBalance, newData.interestRate, newData.term);
            if (pmt > 0) newData.monthlyPayment = parseFloat(pmt.toFixed(2));
        }
        setHomeData(newData);
    };

    const addRental = () => setRentals([...rentals, { id: Date.now(), name: 'New Rental', value: 200000, mortgageBalance: 150000, interestRate: 6.5, monthlyPayment: 948, rent: 1500, expenseRatio: 40, linkedBucketId: -1, appreciationRate: 3.0, term: 30 }]);
    const updateRental = (id, field, val) => {
        setRentals(rentals.map(r => {
            if (r.id !== id) return r;
            let newRental = { ...r, [field]: val };
            if (field === 'term' || field === 'mortgageBalance' || field === 'interestRate') {
                const pmt = calculatePMT(newRental.mortgageBalance, newRental.interestRate, newRental.term);
                if (pmt > 0) newRental.monthlyPayment = parseFloat(pmt.toFixed(2));
            }
            return newRental;
        }));
    };
    const removeRental = (id) => setRentals(rentals.filter(r => r.id !== id));

    // --- Render ---

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">

            {/* Analysis Modal */}
            <Modal
                isOpen={!!analysisItem}
                onClose={() => setAnalysisItem(null)}
                title={`Analysis: ${analysisItem?.name}`}
            >
                {analysisItem && (
                    <PayoffAnalysis
                        amortizationData={analysisAmortization}
                        monthlyPayment={analysisItem.monthlyPayment}
                        linkedBucket={bucketAllocations.find(b => b.id === analysisItem.linkedBucketId)}
                    />
                )}
            </Modal>

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <TrendingUp size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 hidden sm:block">Flow & Grow</h1>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setViewMode('yearly')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Yearly
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Container */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('budget')}
                        className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'budget' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        <Wallet size={18} /> Budget
                    </button>
                    <button
                        onClick={() => setActiveTab('realestate')}
                        className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'realestate' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        <Home size={18} /> Real Estate
                    </button>
                    <button
                        onClick={() => setActiveTab('projections')}
                        className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'projections' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        <TrendingUp size={18} /> Projections
                    </button>
                </div>

                {/* Views */}
                {activeTab === 'dashboard' && (
                    <DashboardView
                        dashboardStats={dashboardStats}
                        setActiveTab={setActiveTab}
                        viewMode={viewMode}
                        totalIncome={totalIncome}
                    />
                )}

                {activeTab === 'budget' && (
                    <BudgetView
                        viewMode={viewMode}
                        totalIncome={totalIncome}
                        incomes={incomes}
                        addIncome={addIncome}
                        updateIncome={updateIncome}
                        removeIncome={removeIncome}
                        totalRentalCashFlow={totalRentalCashFlow}
                        bucketAllocations={bucketAllocations}
                        unallocated={unallocated}
                        updateBucket={updateBucket}
                        removeBucket={removeBucket}
                        addBucket={addBucket}
                    />
                )}

                {activeTab === 'realestate' && (
                    <RealEstateView
                        homeData={homeData}
                        updateHomeData={updateHomeData}
                        buckets={buckets}
                        viewMode={viewMode}
                        amortizationData={amortizationData}
                        bucketAllocations={bucketAllocations}
                        rentals={rentals}
                        addRental={addRental}
                        updateRental={updateRental}
                        removeRental={removeRental}
                        setAnalysisItem={setAnalysisItem}
                    />
                )}

                {activeTab === 'projections' && (
                    <ProjectionsView
                        projectionChartData={projectionChartData}
                        bucketAllocations={bucketAllocations}
                        strategies={strategies}
                        setStrategies={setStrategies}
                        projections={projections}
                    />
                )}

            </div>
        </div>
    );
}