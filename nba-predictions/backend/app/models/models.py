"""SQLAlchemy models for NBA Predictions application."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


class GameStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class User(Base):
    """User model for tracking predictors."""
    
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


class Game(Base):
    """NBA game model."""
    
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String(50), nullable=False, index=True)
    away_team = Column(String(50), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    status = Column(SQLEnum(GameStatus), default=GameStatus.UPCOMING, nullable=False)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    venue = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    predictions = relationship("Prediction", back_populates="game", cascade="all, delete-orphan")

    @property
    def winner(self) -> str | None:
        """Return the winning team if game is completed."""
        if self.status != GameStatus.COMPLETED or self.home_score is None or self.away_score is None:
            return None
        return self.home_team if self.home_score > self.away_score else self.away_team

    def __repr__(self):
        return f"<Game(id={self.id}, {self.away_team} @ {self.home_team})>"


class Prediction(Base):
    """User prediction for a game."""
    
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False, index=True)
    predicted_winner = Column(String(50), nullable=False)
    predicted_spread = Column(Integer, nullable=True)
    is_correct = Column(Boolean, nullable=True)  # Null until game completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="predictions")
    game = relationship("Game", back_populates="predictions")

    def __repr__(self):
        return f"<Prediction(id={self.id}, user={self.user_id}, game={self.game_id}, pick='{self.predicted_winner}')>"
