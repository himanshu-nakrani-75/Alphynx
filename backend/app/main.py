from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from .models import user, portfolio
from .routers import auth, portfolio, market, recommendations

# Create all tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stock Recommendation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(portfolio.router, prefix="/portfolio")
app.include_router(market.router, prefix="/market")
app.include_router(recommendations.router, prefix="/recommendations")

@app.get("/")
def root():
    return {"message": "Welcome to the Stock Recommendation API"}
