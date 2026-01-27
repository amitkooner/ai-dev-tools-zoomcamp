"""API route handlers for NBA Predictions application."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import GameStatus
from app.schemas import (
    HealthResponse,
    UserCreate,
    User,
    UserWithStats,
    UserStats,
    GameCreate,
    GameUpdate,
    Game,
    GameWithPredictions,
    GameList,
    GameStatusEnum,
    PredictionCreate,
    PredictionUpdate,
    Prediction,
    PredictionList,
    Leaderboard,
    LeaderboardPeriod,
)
from app.services import UserService, GameService, PredictionService, LeaderboardService

router = APIRouter()


# ============== Health ==============

@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Check API health status."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0"
    )


# ============== Users ==============

@router.post("/users", response_model=User, status_code=201, tags=["users"])
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account."""
    # Check for existing username
    existing = UserService.get_user_by_username(db, user_data.username)
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")
    
    # Check for existing email
    existing = UserService.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    return UserService.create_user(db, user_data)


@router.get("/users/{user_id}", response_model=UserWithStats, tags=["users"])
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user profile with statistics."""
    user = UserService.get_user_with_stats(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users/{user_id}/stats", response_model=UserStats, tags=["users"])
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get detailed statistics for a user."""
    stats = UserService.get_user_stats(db, user_id)
    if not stats:
        raise HTTPException(status_code=404, detail="User not found")
    return stats


# ============== Games ==============

@router.post("/games", response_model=Game, status_code=201, tags=["games"])
async def create_game(game_data: GameCreate, db: Session = Depends(get_db)):
    """Create a new NBA game."""
    return GameService.create_game(db, game_data)


@router.get("/games", response_model=GameList, tags=["games"])
async def list_games(
    status: Optional[GameStatusEnum] = None,
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List games with optional filtering."""
    games, total = GameService.list_games(
        db, status=status, date_from=date_from, date_to=date_to, limit=limit, offset=offset
    )
    return GameList(games=games, total=total, limit=limit, offset=offset)


@router.get("/games/{game_id}", response_model=GameWithPredictions, tags=["games"])
async def get_game(game_id: int, db: Session = Depends(get_db)):
    """Get game details with prediction statistics."""
    game_data = GameService.get_game_with_predictions(db, game_id)
    if not game_data:
        raise HTTPException(status_code=404, detail="Game not found")
    return game_data


@router.put("/games/{game_id}", response_model=Game, tags=["games"])
async def update_game(game_id: int, game_data: GameUpdate, db: Session = Depends(get_db)):
    """Update game details or final score."""
    game = GameService.update_game(db, game_id, game_data)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


# ============== Predictions ==============

@router.post("/predictions", response_model=Prediction, status_code=201, tags=["predictions"])
async def create_prediction(prediction_data: PredictionCreate, db: Session = Depends(get_db)):
    """Submit a prediction for an upcoming game."""
    # Verify user exists
    user = UserService.get_user(db, prediction_data.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # Verify game exists and is upcoming
    game = GameService.get_game(db, prediction_data.game_id)
    if not game:
        raise HTTPException(status_code=400, detail="Game not found")
    
    if game.status != GameStatus.UPCOMING:
        raise HTTPException(status_code=400, detail="Cannot predict on games that have already started")

    # Verify prediction is for valid team
    if prediction_data.predicted_winner not in [game.home_team, game.away_team]:
        raise HTTPException(
            status_code=400, 
            detail=f"Predicted winner must be '{game.home_team}' or '{game.away_team}'"
        )

    # Check if user already predicted this game
    existing = PredictionService.get_user_prediction_for_game(
        db, prediction_data.user_id, prediction_data.game_id
    )
    if existing:
        raise HTTPException(status_code=409, detail="User already has a prediction for this game")

    return PredictionService.create_prediction(db, prediction_data)


@router.get("/predictions", response_model=PredictionList, tags=["predictions"])
async def list_predictions(
    user_id: Optional[int] = None,
    game_id: Optional[int] = None,
    is_correct: Optional[bool] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List predictions with optional filtering."""
    predictions, total = PredictionService.list_predictions(
        db, user_id=user_id, game_id=game_id, is_correct=is_correct, limit=limit, offset=offset
    )
    
    # Attach game data to each prediction
    prediction_responses = []
    for p in predictions:
        game = GameService.get_game(db, p.game_id)
        prediction_responses.append(Prediction(
            id=p.id,
            user_id=p.user_id,
            game_id=p.game_id,
            predicted_winner=p.predicted_winner,
            predicted_spread=p.predicted_spread,
            is_correct=p.is_correct,
            created_at=p.created_at,
            updated_at=p.updated_at,
            game=game,
        ))
    
    return PredictionList(predictions=prediction_responses, total=total, limit=limit, offset=offset)


@router.get("/predictions/{prediction_id}", response_model=Prediction, tags=["predictions"])
async def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Get a specific prediction."""
    prediction = PredictionService.get_prediction(db, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    game = GameService.get_game(db, prediction.game_id)
    return Prediction(
        id=prediction.id,
        user_id=prediction.user_id,
        game_id=prediction.game_id,
        predicted_winner=prediction.predicted_winner,
        predicted_spread=prediction.predicted_spread,
        is_correct=prediction.is_correct,
        created_at=prediction.created_at,
        updated_at=prediction.updated_at,
        game=game,
    )


@router.put("/predictions/{prediction_id}", response_model=Prediction, tags=["predictions"])
async def update_prediction(
    prediction_id: int, 
    prediction_data: PredictionUpdate, 
    db: Session = Depends(get_db)
):
    """Update a prediction (only before game starts)."""
    prediction = PredictionService.get_prediction(db, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # Check if game has started
    game = GameService.get_game(db, prediction.game_id)
    if game.status != GameStatus.UPCOMING:
        raise HTTPException(status_code=400, detail="Cannot update prediction after game has started")

    # Validate predicted winner if provided
    if prediction_data.predicted_winner:
        if prediction_data.predicted_winner not in [game.home_team, game.away_team]:
            raise HTTPException(
                status_code=400,
                detail=f"Predicted winner must be '{game.home_team}' or '{game.away_team}'"
            )

    updated = PredictionService.update_prediction(db, prediction_id, prediction_data)
    return Prediction(
        id=updated.id,
        user_id=updated.user_id,
        game_id=updated.game_id,
        predicted_winner=updated.predicted_winner,
        predicted_spread=updated.predicted_spread,
        is_correct=updated.is_correct,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        game=game,
    )


@router.delete("/predictions/{prediction_id}", status_code=204, tags=["predictions"])
async def delete_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Delete a prediction (only before game starts)."""
    prediction = PredictionService.get_prediction(db, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # Check if game has started
    game = GameService.get_game(db, prediction.game_id)
    if game.status != GameStatus.UPCOMING:
        raise HTTPException(status_code=400, detail="Cannot delete prediction after game has started")

    PredictionService.delete_prediction(db, prediction_id)
    return None


# ============== Leaderboard ==============

@router.get("/leaderboard", response_model=Leaderboard, tags=["leaderboard"])
async def get_leaderboard(
    period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get the prediction accuracy leaderboard."""
    entries = LeaderboardService.get_leaderboard(db, period=period, limit=limit)
    return Leaderboard(
        entries=entries,
        period=period,
        updated_at=datetime.utcnow(),
    )
