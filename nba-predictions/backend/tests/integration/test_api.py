"""Integration tests for API endpoints."""

import pytest
from datetime import datetime, timedelta


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, client):
        """Test health check returns healthy status."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["version"] == "1.0.0"


class TestUserEndpoints:
    """Tests for user API endpoints."""

    def test_create_user(self, client):
        """Test creating a new user via API."""
        response = client.post("/api/users", json={
            "username": "api_test_user",
            "email": "api_test@example.com",
            "display_name": "API Test User"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "api_test_user"
        assert data["email"] == "api_test@example.com"
        assert "id" in data

    def test_create_user_duplicate_username(self, client):
        """Test creating user with duplicate username fails."""
        # Create first user
        client.post("/api/users", json={
            "username": "duplicate_user",
            "email": "first@example.com"
        })
        
        # Try to create second user with same username
        response = client.post("/api/users", json={
            "username": "duplicate_user",
            "email": "second@example.com"
        })
        assert response.status_code == 409

    def test_create_user_invalid_email(self, client):
        """Test creating user with invalid email fails."""
        response = client.post("/api/users", json={
            "username": "invalid_email_user",
            "email": "not-an-email"
        })
        assert response.status_code == 422

    def test_get_user(self, client):
        """Test getting user by ID."""
        # Create user first
        create_response = client.post("/api/users", json={
            "username": "get_test_user",
            "email": "get_test@example.com"
        })
        user_id = create_response.json()["id"]
        
        # Get user
        response = client.get(f"/api/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "get_test_user"
        assert "total_predictions" in data

    def test_get_user_not_found(self, client):
        """Test getting non-existent user returns 404."""
        response = client.get("/api/users/9999")
        assert response.status_code == 404


class TestGameEndpoints:
    """Tests for game API endpoints."""

    def test_create_game(self, client):
        """Test creating a new game via API."""
        future_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        response = client.post("/api/games", json={
            "home_team": "Bulls",
            "away_team": "Pistons",
            "scheduled_at": future_date,
            "venue": "United Center"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["home_team"] == "Bulls"
        assert data["status"] == "upcoming"

    def test_list_games(self, client):
        """Test listing games."""
        # Create some games
        future_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        client.post("/api/games", json={
            "home_team": "Rockets",
            "away_team": "Spurs",
            "scheduled_at": future_date
        })
        
        response = client.get("/api/games")
        assert response.status_code == 200
        data = response.json()
        assert "games" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_list_games_with_status_filter(self, client):
        """Test filtering games by status."""
        response = client.get("/api/games?status=upcoming")
        assert response.status_code == 200

    def test_get_game(self, client):
        """Test getting game details."""
        # Create game first
        future_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        create_response = client.post("/api/games", json={
            "home_team": "Suns",
            "away_team": "Nuggets",
            "scheduled_at": future_date
        })
        game_id = create_response.json()["id"]
        
        response = client.get(f"/api/games/{game_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["home_team"] == "Suns"
        assert "prediction_count" in data

    def test_update_game(self, client):
        """Test updating game with final score."""
        # Create game
        future_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        create_response = client.post("/api/games", json={
            "home_team": "Thunder",
            "away_team": "Jazz",
            "scheduled_at": future_date
        })
        game_id = create_response.json()["id"]
        
        # Update game
        response = client.put(f"/api/games/{game_id}", json={
            "status": "completed",
            "home_score": 115,
            "away_score": 108
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["home_score"] == 115


class TestPredictionEndpoints:
    """Tests for prediction API endpoints."""

    def test_create_prediction(self, client):
        """Test creating a prediction via API."""
        # Create user
        user_response = client.post("/api/users", json={
            "username": "predictor",
            "email": "predictor@example.com"
        })
        user_id = user_response.json()["id"]
        
        # Create game
        future_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        game_response = client.post("/api/games", json={
            "home_team": "Bucks",
            "away_team": "76ers",
            "scheduled_at": future_date
        })
        game_id = game_response.json()["id"]
        
        # Create prediction
        response = client.post("/api/predictions", json={
            "user_id": user_id,
            "game_id": game_id,
            "predicted_winner": "Bucks",
            "predicted_spread": 8
        })
        assert response.status_code == 201
        data = response.json()
        assert data["predicted_winner"] == "Bucks"
        assert data["is_correct"] is None

    def test_create_prediction_invalid_winner(self, client):
        """Test creating prediction with invalid winner fails."""
        # Create user
        user_response = client.post("/api/users", json={
            "username": "bad_predictor",
            "email": "bad@example.com"
        })
        user_id = user_response.json()["id"]
        
        # Create game
        future_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        game_response = client.post("/api/games", json={
            "home_team": "Mavs",
            "away_team": "Clippers",
            "scheduled_at": future_date
        })
        game_id = game_response.json()["id"]
        
        # Try to predict team not in game
        response = client.post("/api/predictions", json={
            "user_id": user_id,
            "game_id": game_id,
            "predicted_winner": "Lakers"  # Not in this game
        })
        assert response.status_code == 400

    def test_create_duplicate_prediction(self, client):
        """Test creating duplicate prediction fails."""
        # Create user and game
        user_response = client.post("/api/users", json={
            "username": "dup_predictor",
            "email": "dup@example.com"
        })
        user_id = user_response.json()["id"]
        
        future_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        game_response = client.post("/api/games", json={
            "home_team": "Kings",
            "away_team": "Pelicans",
            "scheduled_at": future_date
        })
        game_id = game_response.json()["id"]
        
        # Create first prediction
        client.post("/api/predictions", json={
            "user_id": user_id,
            "game_id": game_id,
            "predicted_winner": "Kings"
        })
        
        # Try to create duplicate
        response = client.post("/api/predictions", json={
            "user_id": user_id,
            "game_id": game_id,
            "predicted_winner": "Pelicans"
        })
        assert response.status_code == 409

    def test_list_predictions(self, client):
        """Test listing predictions with filters."""
        response = client.get("/api/predictions")
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert "total" in data

    def test_delete_prediction(self, client):
        """Test deleting a prediction."""
        # Create user, game, and prediction
        user_response = client.post("/api/users", json={
            "username": "delete_predictor",
            "email": "delete@example.com"
        })
        user_id = user_response.json()["id"]
        
        future_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        game_response = client.post("/api/games", json={
            "home_team": "Timberwolves",
            "away_team": "Grizzlies",
            "scheduled_at": future_date
        })
        game_id = game_response.json()["id"]
        
        prediction_response = client.post("/api/predictions", json={
            "user_id": user_id,
            "game_id": game_id,
            "predicted_winner": "Timberwolves"
        })
        prediction_id = prediction_response.json()["id"]
        
        # Delete prediction
        response = client.delete(f"/api/predictions/{prediction_id}")
        assert response.status_code == 204
        
        # Verify it's gone
        get_response = client.get(f"/api/predictions/{prediction_id}")
        assert get_response.status_code == 404


class TestLeaderboardEndpoints:
    """Tests for leaderboard API endpoints."""

    def test_get_leaderboard(self, client):
        """Test getting leaderboard."""
        response = client.get("/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert "period" in data
        assert data["period"] == "all_time"

    def test_get_leaderboard_with_period(self, client):
        """Test getting leaderboard with different time periods."""
        for period in ["all_time", "season", "month", "week"]:
            response = client.get(f"/api/leaderboard?period={period}")
            assert response.status_code == 200
            assert response.json()["period"] == period


class TestRootEndpoint:
    """Tests for root endpoint."""

    def test_root_endpoint(self, client):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "docs" in data
