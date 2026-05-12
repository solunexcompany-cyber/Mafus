from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MAFOS Backend API",
    description="Micro Asset Financing Operating System",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default
    "http://localhost:5174", # Vite fallback port
    # Add other production origins later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to MAFOS API"}

from app.api.api import api_router
from app.core.config import settings
app.include_router(api_router, prefix=settings.API_V1_STR)
