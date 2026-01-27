"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from enum import Enum


class GameStatusEnum(str, Enum):
    UPCOMING = "upcoming"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class LeaderboardPeriod(str, Enum):
    ALL_TIME = "all_time"
    SEASON = "season"
    MONTH = "month"
    WEEK = "week"


# ============== Health ==============

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str = "1.0.0"


# ============== User Schemas ==============

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    display_name: Optional[str] = Field(None, max_length=100)


class UserBase(BaseModel):
    id: int
    username: str
    email: EmailStr
    display_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class User(UserBase):
    pass


class UserWithStats(UserBase):
    total_predictions: int = 0
    correct_predictions: int = 0
    accuracy_percentage: float = 0.0


class TeamAccuracy(BaseModel):
    team: str
    predictions: int
    correct: int
    accuracy: float


class StreakInfo(BaseModel):
    type: str  # "winning", "losing", "none"
    count: int


class UserStats(BaseModel):
    user_id: int
    total_predictions: int
    correct_predictions: int
    accuracy_percentage: float
    predictions_by_team: List[TeamAccuracy] = []
    recent_form: List[bool] = []  # Last 10 predictions
    streak: StreakInfo


# ============== Game Schemas ==============

class GameCreate(BaseModel):
    home_team: str = Field(..., max_length=50)
    away_team: str = Field(..., max_length=50)
    scheduled_at: datetime
    venue: Optional[str] = Field(None, max_length=100)


class GameUpdate(BaseModel):
    status: Optional[GameStatusEnum] = None
    home_score: Optional[int] = Field(None, ge=0)
    away_score: Optional[int] = Field(None, ge=0)
    scheduled_at: Optional[datetime] = None


class Game(BaseModel):
    id: int
    home_team: str
    away_team: str
    scheduled_at: datetime
    status: GameStatusEnum
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    venue: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GameWithPredictions(Game):
    prediction_count: int = 0
    home_pick_percentage: float = 0.0
    away_pick_percentage: float = 0.0


class GameList(BaseModel):
    games: List[Game]
    total: int
    limit: int
    offset: int


# ============== Prediction Schemas ==============

class PredictionCreate(BaseModel):
    user_id: int
    game_id: int
    predicted_winner: str = Field(..., max_length=50)
    predicted_spread: Optional[int] = None


class PredictionUpdate(BaseModel):
    predicted_winner: Optional[str] = Field(None, max_length=50)
    predicted_spread: Optional[int] = None


class Prediction(BaseModel):
    id: int
    user_id: int
    game_id: int
    predicted_winner: str
    predicted_spread: Optional[int] = None
    is_correct: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    game: Optional[Game] = None

    model_config = ConfigDict(from_attributes=True)


class PredictionList(BaseModel):
    predictions: List[Prediction]
    total: int
    limit: int
    offset: int


# ============== Leaderboard Schemas ==============

class LeaderboardEntry(BaseModel):
    rank: int
    user: User
    total_predictions: int
    correct_predictions: int
    accuracy_percentage: float


class Leaderboard(BaseModel):
    entries: List[LeaderboardEntry]
    period: LeaderboardPeriod
    updated_at: datetime


# ============== Error Schema ==============

class ErrorResponse(BaseModel):
    detail: str
