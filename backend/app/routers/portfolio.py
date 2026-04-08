from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core import database, schemas
from ..models import portfolio as models_portfolio, user as models_user
from .auth import get_current_user

router = APIRouter(tags=["portfolio"])

@router.get("/", response_model=List[schemas.PortfolioItem])
def get_portfolio(
    current_user: models_user.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models_portfolio.PortfolioItem).filter(models_portfolio.PortfolioItem.owner_id == current_user.id).all()

@router.post("/", response_model=schemas.PortfolioItem)
def create_portfolio_item(
    item: schemas.PortfolioItemCreate,
    current_user: models_user.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Check if stock already in portfolio
    existing_item = db.query(models_portfolio.PortfolioItem).filter(
        models_portfolio.PortfolioItem.owner_id == current_user.id,
        models_portfolio.PortfolioItem.ticker == item.ticker.upper()
    ).first()

    if existing_item:
        raise HTTPException(status_code=400, detail="Stock already exists in portfolio")

    db_item = models_portfolio.PortfolioItem(
        ticker=item.ticker.upper(),
        shares=item.shares,
        average_cost=item.average_cost,
        owner_id=current_user.id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}", response_model=schemas.PortfolioItem)
def delete_portfolio_item(
    item_id: int,
    current_user: models_user.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    db_item = db.query(models_portfolio.PortfolioItem).filter(
        models_portfolio.PortfolioItem.id == item_id,
        models_portfolio.PortfolioItem.owner_id == current_user.id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    db.delete(db_item)
    db.commit()
    return db_item
