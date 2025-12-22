from pydantic import BaseModel
from typing import List, Dict, Optional

# --- Core Data Models ---

class Strategy(BaseModel):
    id: str
    name: str
    allocation: float
    returnRate: float
    reinvest: bool
    principal: Optional[float] = 0
    basePrincipal: Optional[float] = 0
    totalCashFlow: Optional[float] = 0

class Bucket(BaseModel):
    id: int
    name: str
    annualAmount: float
    startingBalance: Optional[float] = 0

class BucketAllocation(BaseModel):
    id: int
    monthlyAmount: float

# --- Real Estate Models ---

class PropertyBase(BaseModel):
    homeValue: float
    mortgageBalance: float
    interestRate: float
    appreciationRate: float = 3.0
    monthlyPayment: float
    linkedBucketId: int

class Rental(BaseModel):
    id: int
    name: str
    value: float
    mortgageBalance: float
    interestRate: float
    monthlyPayment: float
    rent: float
    expenseRatio: float
    linkedBucketId: int
    appreciationRate: float = 3.0

class HomeData(PropertyBase):
    pass

# --- Request Models ---

class AmortizationRequest(BaseModel):
    mortgageBalance: float
    interestRate: float
    monthlyPayment: float
    extraPrincipalMonthly: float = 0

class ProjectionRequest(BaseModel):
    contributions: List[Bucket]
    strategies: Dict[str, List[Strategy]]
    projectionYears: List[int]
    homeData: Optional[HomeData]
    rentals: List[Rental]
    bucketAllocations: List[BucketAllocation]