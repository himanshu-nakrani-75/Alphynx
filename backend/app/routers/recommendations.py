from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import yfinance as yf
from typing import List, Dict
import random
from ..core import database
from ..models import portfolio as models_portfolio, user as models_user
from .auth import get_current_user

router = APIRouter(tags=["recommendations"])

# Static list of popular stocks mapped to sectors
POPULAR_STOCKS_BY_SECTOR = {
    "Technology": ["AAPL", "MSFT", "GOOGL", "NVDA", "CRM"],
    "Healthcare": ["JNJ", "UNH", "PFE", "ABBV", "TMO"],
    "Financial Services": ["JPM", "V", "MA", "BAC", "WFC"],
    "Consumer Cyclical": ["AMZN", "TSLA", "HD", "MCD", "NKE"],
    "Communication Services": ["META", "NFLX", "DIS", "CMCSA", "VZ"],
    "Industrials": ["HON", "UNP", "BA", "GE", "CAT"],
    "Consumer Defensive": ["WMT", "PG", "KO", "PEP", "COST"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG"],
    "Utilities": ["NEE", "DUK", "SO", "D", "AEP"],
    "Real Estate": ["PLD", "AMT", "CCI", "EQIX", "SPG"],
    "Basic Materials": ["LIN", "SHW", "NEM", "ECL", "APD"]
}

@router.get("/")
def get_recommendations(
    current_user: models_user.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    portfolio_items = db.query(models_portfolio.PortfolioItem).filter(
        models_portfolio.PortfolioItem.owner_id == current_user.id
    ).all()

    user_sectors = {}
    total_value = 0

    # Analyze current portfolio
    if not portfolio_items:
        # If portfolio is empty, return top tech and finance stocks
        recommended_tickers = ["AAPL", "MSFT", "JPM", "V", "JNJ"]
    else:
        owned_tickers = []
        for item in portfolio_items:
            ticker = item.ticker
            owned_tickers.append(ticker)
            try:
                stock_info = yf.Ticker(ticker).info
                sector = stock_info.get("sector", "Unknown")
                price = stock_info.get("currentPrice") or stock_info.get("regularMarketPrice") or 0
                value = price * item.shares
                
                user_sectors[sector] = user_sectors.get(sector, 0) + value
                total_value += value
            except Exception:
                continue

        # Find underrepresented sectors
        underrepresented_sectors = []
        all_sectors = list(POPULAR_STOCKS_BY_SECTOR.keys())
        
        if total_value == 0:
            underrepresented_sectors = all_sectors
        else:
            for sector in all_sectors:
                weight = user_sectors.get(sector, 0) / total_value
                # If sector weight is less than 5% (or not present), recommend it
                if weight < 0.05:
                    underrepresented_sectors.append(sector)

        # Pick random stocks from underrepresented sectors
        recommended_tickers = []
        for sector in underrepresented_sectors[:3]: # Pick top 3 underrepresented sectors
            candidates = POPULAR_STOCKS_BY_SECTOR[sector]
            available = [s for s in candidates if s not in owned_tickers]
            if available:
                recommended_tickers.extend(random.sample(available, min(2, len(available))))
        
        # If we don't have enough recommendations, fill with others
        if len(recommended_tickers) < 5:
            all_candidates = []
            for sector, tickers in POPULAR_STOCKS_BY_SECTOR.items():
                all_candidates.extend(tickers)
            available = [s for s in all_candidates if s not in owned_tickers and s not in recommended_tickers]
            if available:
                recommended_tickers.extend(random.sample(available, min(5 - len(recommended_tickers), len(available))))

    # Fetch live data for recommended stocks
    recommendations = []
    for ticker in recommended_tickers[:5]: # Ensure max 5
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            current_price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose", 0)
            previous_close = info.get("previousClose", current_price)
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100 if previous_close else 0.0
            
            recommendations.append({
                "ticker": ticker,
                "company_name": info.get("shortName", ticker),
                "sector": info.get("sector", "Unknown"),
                "price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "reason": "Diversification - Underrepresented Sector" if portfolio_items else "Top Pick"
            })
        except Exception:
            continue

    return {"recommendations": recommendations}
