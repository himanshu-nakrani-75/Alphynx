import timeit
import random

# Static list of popular stocks mapped to sectors
POPULAR_STOCKS_BY_SECTOR = {
    "Technology": ["AAPL", "MSFT", "GOOGL", "NVDA", "CRM", "INTC", "CSCO", "AMD", "QCOM", "TXN"],
    "Healthcare": ["JNJ", "UNH", "PFE", "ABBV", "TMO", "MRK", "DHR", "BMY", "AMGN", "CVS"],
    "Financial Services": ["JPM", "V", "MA", "BAC", "WFC", "C", "GS", "MS", "SCHW", "AXP"],
    "Consumer Cyclical": ["AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "LOW", "BKNG", "TJX", "TGT"],
    "Communication Services": ["META", "NFLX", "DIS", "CMCSA", "VZ", "T", "CHTR", "TMUS", "EA", "ATVI"],
    "Industrials": ["HON", "UNP", "BA", "GE", "CAT", "LMT", "UPS", "RTX", "DE", "MMM"],
    "Consumer Defensive": ["WMT", "PG", "KO", "PEP", "COST", "PM", "MO", "EL", "CL", "KMB"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "PXD", "MPC", "PSX", "VLO", "OXY"],
    "Utilities": ["NEE", "DUK", "SO", "D", "AEP", "SRE", "EXC", "XEL", "ED", "PEG"],
    "Real Estate": ["PLD", "AMT", "CCI", "EQIX", "SPG", "PSA", "O", "WELL", "DLR", "AVB"],
    "Basic Materials": ["LIN", "SHW", "NEM", "ECL", "APD", "FCX", "NUE", "DOW", "CTVA", "ALB"]
}

# Generate a large list of owned tickers to simulate a realistic scenario and exaggerate the O(N) lookup penalty
# 10,000 tickers to make the O(N) cost very obvious for the benchmark
owned_tickers = [f"TICKER_{i}" for i in range(10000)]
# Ensure some popular stocks are in owned_tickers
owned_tickers.extend(["AAPL", "MSFT", "JNJ", "JPM", "AMZN", "META", "HON", "WMT", "XOM", "NEE", "PLD", "LIN"])

underrepresented_sectors = ["Technology", "Healthcare", "Financial Services", "Consumer Cyclical", "Communication Services"]

def original_logic():
    recommended_tickers = []
    for sector in underrepresented_sectors[:3]:
        candidates = POPULAR_STOCKS_BY_SECTOR[sector]
        available = [s for s in candidates if s not in owned_tickers]
        if available:
            recommended_tickers.extend(random.sample(available, min(2, len(available))))

    if len(recommended_tickers) < 5:
        all_candidates = []
        for sector, tickers in POPULAR_STOCKS_BY_SECTOR.items():
            all_candidates.extend(tickers)
        available = [s for s in all_candidates if s not in owned_tickers and s not in recommended_tickers]
        if available:
            recommended_tickers.extend(random.sample(available, min(5 - len(recommended_tickers), len(available))))

def optimized_logic():
    owned_tickers_set = set(owned_tickers)
    recommended_tickers = []
    for sector in underrepresented_sectors[:3]:
        candidates = POPULAR_STOCKS_BY_SECTOR[sector]
        available = [s for s in candidates if s not in owned_tickers_set]
        if available:
            recommended_tickers.extend(random.sample(available, min(2, len(available))))

    if len(recommended_tickers) < 5:
        all_candidates = []
        for sector, tickers in POPULAR_STOCKS_BY_SECTOR.items():
            all_candidates.extend(tickers)
        recommended_tickers_set = set(recommended_tickers)
        available = [s for s in all_candidates if s not in owned_tickers_set and s not in recommended_tickers_set]
        if available:
            recommended_tickers.extend(random.sample(available, min(5 - len(recommended_tickers), len(available))))

if __name__ == "__main__":
    original_time = timeit.timeit(original_logic, number=1000)
    print(f"Original logic execution time (1000 iterations): {original_time:.4f} seconds")

    optimized_time = timeit.timeit(optimized_logic, number=1000)
    print(f"Optimized logic execution time (1000 iterations): {optimized_time:.4f} seconds")

    speedup = original_time / optimized_time
    print(f"Speedup: {speedup:.2f}x")
