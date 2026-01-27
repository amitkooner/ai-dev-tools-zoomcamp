"""Pytest configuration and fixtures for backend tests."""

import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base, get_db
from app.models import User, Game, Prediction, GameStatus


# Create test database engine (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create test client with database override."""
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    
    with TestClient(app) as test_client:
        yield test_client
    
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user(db):
    """Create a sample user for testing."""
    user = User(
        username="test_user",
        email="test@example.com",
        display_name="Test User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def sample_game(db):
    """Create a sample upcoming game for testing."""
    game = Game(
        home_team="Lakers",
        away_team="Celtics",
        scheduled_at=datetime.utcnow() + timedelta(days=1),
        status=GameStatus.UPCOMING,
        venue="Crypto.com Arena"
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@pytest.fixture
def completed_game(db):
    """Create a completed game for testing."""
    game = Game(
        home_team="Warriors",
        away_team="Heat",
        scheduled_at=datetime.utcnow() - timedelta(days=1),
        status=GameStatus.COMPLETED,
        home_score=112,
        away_score=105,
        venue="Chase Center"
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@pytest.fixture
def sample_prediction(db, sample_user, sample_game):
    """Create a sample prediction for testing."""
    prediction = Prediction(
        user_id=sample_user.id,
        game_id=sample_game.id,
        predicted_winner="Lakers",
        predicted_spread=5
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction
