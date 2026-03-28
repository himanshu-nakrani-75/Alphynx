import pandas as pd
import numpy as np
import timeit
from datetime import datetime, timedelta

# Create a dummy DataFrame similar to yfinance history
def create_dummy_data(rows=1000):
    dates = [datetime(2020, 1, 1) + timedelta(days=i) for i in range(rows)]
    data = {
        "Close": np.random.uniform(100, 200, rows),
        "High": np.random.uniform(100, 200, rows),
        "Low": np.random.uniform(100, 200, rows),
        "Open": np.random.uniform(100, 200, rows),
        "Volume": np.random.randint(1000, 1000000, rows)
    }
    df = pd.DataFrame(data, index=dates)
    df.index.name = "Date"
    return df

def original_method(hist):
    data = []
    for date, row in hist.iterrows():
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "close": round(row["Close"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2)
        })
    return data

def itertuples_method(hist):
    data = []
    for row in hist.itertuples():
        data.append({
            "date": row.Index.strftime("%Y-%m-%d"),
            "close": round(row.Close, 2),
            "high": round(row.High, 2),
            "low": round(row.Low, 2)
        })
    return data

def to_dict_method(hist):
    df_reset = hist.reset_index()
    df_reset['date'] = df_reset['Date'].dt.strftime("%Y-%m-%d")
    df_reset['close'] = df_reset['Close'].round(2)
    df_reset['high'] = df_reset['High'].round(2)
    df_reset['low'] = df_reset['Low'].round(2)
    return df_reset[['date', 'close', 'high', 'low']].to_dict('records')

if __name__ == "__main__":
    df = create_dummy_data(5000)

    n = 10
    t1 = timeit.timeit(lambda: original_method(df), number=n)
    print(f"Original (iterrows): {t1/n:.5f} s per call")

    t2 = timeit.timeit(lambda: itertuples_method(df), number=n)
    print(f"itertuples: {t2/n:.5f} s per call")

    t3 = timeit.timeit(lambda: to_dict_method(df), number=n)
    print(f"to_dict: {t3/n:.5f} s per call")

    print(f"Speedup itertuples: {t1/t2:.2f}x")
    print(f"Speedup to_dict: {t1/t3:.2f}x")

    # Verify results are same
    res1 = original_method(df)
    res2 = itertuples_method(df)
    res3 = to_dict_method(df)

    assert res1 == res2 == res3
    print("All methods returned identical results.")
