from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from .models import AmortizationRequest, ProjectionRequest
    from .services import FinancialCalculator
except ImportError:
    from models import AmortizationRequest, ProjectionRequest
    from services import FinancialCalculator

app = FastAPI(title="Flow & Grow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/calculate-amortization")
async def calculate_amortization(data: AmortizationRequest):
    return FinancialCalculator.generate_amortization_schedule(data)

@app.post("/api/calculate-projections")
async def calculate_projections(data: ProjectionRequest):
    return FinancialCalculator.generate_projections(data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)