"""Unit tests for service layer."""

import pytest
from datetime import datetime, timedelta

from app.models import User, Game, Prediction, GameStatus
from app.schemas import UserCreate, GameCreate, GameUpdate, PredictionCreate, GameStatusEnum
from app.services import UserService, GameService, PredictionService


class TestUserService:
    """Tests for UserService."""

    def test_create_user(self, db):
        """Test creating a new user."""
        user_data = UserCreate(
            username="newuser",
            email="new@example.com",
            display_name="New User"
        )
        user = UserService.create_user(db, user_data)
        
        assert user.id is not None
        assert user.username == "newuser"
        assert user.email == "new@example.com"
        assert user.display_name == "New User"

    def test_get_user(self, db, sample_user):
        """Test getting user by ID."""
        user = UserService.get_user(db, sample_user.id)
        assert user is not None
        assert user.username == sample_user.username

    def test_get_user_not_found(self, db):
        """Test getting non-existent user."""
        user = UserService.get_user(db, 9999)
        assert user is None

    def test_get_user_by_username(self, db, sample_user):
        """Test finding user by username."""
        user = UserService.get_user_by_username(db, sample_user.username)
        assert user is not None
        assert user.id == sample_user.id

    def test_get_user_with_stats(self, db, sample_user):
        """Test getting user with statistics."""
        stats = UserService.get_user_with_stats(db, sample_user.id)
        assert stats is not None
        assert stats.total_predictions == 0
        assert stats.accuracy_percentage == 0.0


class TestGameService:
    """Tests for GameService."""

    def test_create_game(self, db):
        """Test creating a new game."""
        game_data = GameCreate(
            home_team="Knicks",
            away_team="Nets",
            scheduled_at=datetime.utcnow() + timedelta(days=2),
            venue="Madison Square Garden"
        )
        game = GameService.create_game(db, game_data)
        
        assert game.id is not None
        assert game.home_team == "Knicks"
        assert game.away_team == "Nets"
        assert game.status == GameStatus.UPCOMING

    def test_get_game(self, db, sample_game):
        """Test getting game by ID."""
        game = GameService.get_game(db, sample_game.id)
        assert game is not None
        assert game.home_team == sample_game.home_team

    def test_list_games(self, db, sample_game, completed_game):
        """Test listing games."""
        games, total = GameService.list_games(db)
        assert total == 2
        assert len(games) == 2

    def test_list_games_filter_by_status(self, db, sample_game, completed_game):
        """Test filtering games by status."""
        games, total = GameService.list_games(db, status=GameStatusEnum.UPCOMING)
        assert total == 1
        assert games[0].id == sample_game.id

    def test_update_game(self, db, sample_game):
        """Test updating game details."""
        update_data = GameUpdate(
            status=GameStatusEnum.COMPLETED,
            home_score=110,
            away_score=105
        )
        updated = GameService.update_game(db, sample_game.id, update_data)
        
        assert updated.status == GameStatus.COMPLETED
        assert updated.home_score == 110
        assert updated.away_score == 105

    def test_update_game_updates_predictions(self, db, sample_game, sample_prediction):
        """Test that completing a game updates prediction correctness."""
        update_data = GameUpdate(
            status=GameStatusEnum.COMPLETED,
            home_score=110,
            away_score=105
        )
        GameService.update_game(db, sample_game.id, update_data)
        
        # Refresh prediction
        db.refresh(sample_prediction)
        
        # Lakers won (home team), prediction was for Lakers
        assert sample_prediction.is_correct == True


class TestPredictionService:
    """Tests for PredictionService."""

    def test_create_prediction(self, db, sample_user, sample_game):
        """Test creating a new prediction."""
        prediction_data = PredictionCreate(
            user_id=sample_user.id,
            game_id=sample_game.id,
            predicted_winner="Celtics",
            predicted_spread=3
        )
        prediction = PredictionService.create_prediction(db, prediction_data)
        
        assert prediction.id is not None
        assert prediction.predicted_winner == "Celtics"
        assert prediction.is_correct is None  # Game not completed

    def test_get_prediction(self, db, sample_prediction):
        """Test getting prediction by ID."""
        prediction = PredictionService.get_prediction(db, sample_prediction.id)
        assert prediction is not None
        assert prediction.predicted_winner == sample_prediction.predicted_winner

    def test_get_user_prediction_for_game(self, db, sample_user, sample_game, sample_prediction):
        """Test checking existing prediction."""
        existing = PredictionService.get_user_prediction_for_game(
            db, sample_user.id, sample_game.id
        )
        assert existing is not None
        assert existing.id == sample_prediction.id

    def test_list_predictions(self, db, sample_prediction):
        """Test listing predictions."""
        predictions, total = PredictionService.list_predictions(db)
        assert total == 1
        assert predictions[0].id == sample_prediction.id

    def test_list_predictions_filter_by_user(self, db, sample_user, sample_prediction):
        """Test filtering predictions by user."""
        predictions, total = PredictionService.list_predictions(db, user_id=sample_user.id)
        assert total == 1

    def test_delete_prediction(self, db, sample_prediction):
        """Test deleting a prediction."""
        result = PredictionService.delete_prediction(db, sample_prediction.id)
        assert result == True
        
        # Verify deletion
        prediction = PredictionService.get_prediction(db, sample_prediction.id)
        assert prediction is None
