from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter(tags=["market"])

@router.get("/quote/{ticker}")
def get_quote(ticker: str):
    try:
        stock = yf.Ticker(ticker.upper())
        info = stock.info
        
        current_price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        if not current_price:
            raise HTTPException(status_code=404, detail=f"Price data not found for {ticker}")

        previous_close = info.get("previousClose", current_price)
        change = current_price - previous_close
        change_percent = (change / previous_close) * 100 if previous_close else 0.0

        return {
            "ticker": ticker.upper(),
            "price": current_price,
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "company_name": info.get("shortName", ticker.upper())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{ticker}")
def get_history(ticker: str, period: str = "1mo"):
    """Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max"""
    try:
        stock = yf.Ticker(ticker.upper())
        hist = stock.history(period=period)
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        # Prepare the data using vectorized operations
        # Round values and rename columns to match the expected output
        data_df = hist[['Close', 'High', 'Low']].round(2).rename(
            columns={'Close': 'close', 'High': 'high', 'Low': 'low'}
        )
        # Format the index (Date) as string
        data_df['date'] = hist.index.strftime("%Y-%m-%d")

        # Convert to list of dictionaries in the correct order
        data = data_df[['date', 'close', 'high', 'low']].to_dict('records')
        return {"ticker": ticker.upper(), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info/{ticker}")
def get_info(ticker: str):
    try:
        stock = yf.Ticker(ticker.upper())
        info = stock.info
        return {
            "ticker": ticker.upper(),
            "company_name": info.get("shortName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "summary": info.get("longBusinessSummary"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "dividend_yield": info.get("dividendYield"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
