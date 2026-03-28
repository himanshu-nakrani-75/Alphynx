from pydantic import BaseModel
from typing import List, Optional

# User
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Portfolio
class PortfolioItemBase(BaseModel):
    ticker: str
    shares: float
    average_cost: float

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItem(PortfolioItemBase):
    id: int
    owner_id: int
    class Config:
        from_attributes = True

# Stock Data
class StockQuote(BaseModel):
    ticker: str
    price: float
    change: float
    change_percent: float
    company_name: str
