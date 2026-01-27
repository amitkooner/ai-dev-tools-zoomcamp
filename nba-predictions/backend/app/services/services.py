"""Business logic services for NBA Predictions application."""

from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models import User, Game, Prediction, GameStatus
from app.schemas import (
    UserCreate,
    UserWithStats,
    UserStats,
    TeamAccuracy,
    StreakInfo,
    GameCreate,
    GameUpdate,
    GameStatusEnum,
    PredictionCreate,
    PredictionUpdate,
    LeaderboardEntry,
    LeaderboardPeriod,
)


class UserService:
    """Service for user-related operations."""

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """Create a new user."""
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            display_name=user_data.display_name,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_with_stats(db: Session, user_id: int) -> Optional[UserWithStats]:
        """Get user with prediction statistics."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Calculate stats
        total = db.query(Prediction).filter(Prediction.user_id == user_id).count()
        correct = db.query(Prediction).filter(
            Prediction.user_id == user_id,
            Prediction.is_correct == True
        ).count()
        
        accuracy = (correct / total * 100) if total > 0 else 0.0

        return UserWithStats(
            id=user.id,
            username=user.username,
            email=user.email,
            display_name=user.display_name,
            created_at=user.created_at,
            total_predictions=total,
            correct_predictions=correct,
            accuracy_percentage=round(accuracy, 2),
        )

    @staticmethod
    def get_user_stats(db: Session, user_id: int) -> Optional[UserStats]:
        """Get detailed user statistics."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Basic stats
        predictions = db.query(Prediction).filter(Prediction.user_id == user_id).all()
        total = len(predictions)
        correct = sum(1 for p in predictions if p.is_correct)
        accuracy = (correct / total * 100) if total > 0 else 0.0

        # Team-by-team accuracy
        team_stats = {}
        for p in predictions:
            if p.is_correct is not None:
                if p.predicted_winner not in team_stats:
                    team_stats[p.predicted_winner] = {"predictions": 0, "correct": 0}
                team_stats[p.predicted_winner]["predictions"] += 1
                if p.is_correct:
                    team_stats[p.predicted_winner]["correct"] += 1

        predictions_by_team = [
            TeamAccuracy(
                team=team,
                predictions=stats["predictions"],
                correct=stats["correct"],
                accuracy=round(stats["correct"] / stats["predictions"] * 100, 2) if stats["predictions"] > 0 else 0.0
            )
            for team, stats in team_stats.items()
        ]

        # Recent form (last 10 completed predictions)
        recent = db.query(Prediction).filter(
            Prediction.user_id == user_id,
            Prediction.is_correct.isnot(None)
        ).order_by(Prediction.updated_at.desc()).limit(10).all()
        recent_form = [p.is_correct for p in recent]

        # Calculate streak
        streak_type = "none"
        streak_count = 0
        if recent_form:
            first_result = recent_form[0]
            streak_type = "winning" if first_result else "losing"
            for result in recent_form:
                if result == first_result:
                    streak_count += 1
                else:
                    break

        return UserStats(
            user_id=user_id,
            total_predictions=total,
            correct_predictions=correct,
            accuracy_percentage=round(accuracy, 2),
            predictions_by_team=predictions_by_team,
            recent_form=recent_form,
            streak=StreakInfo(type=streak_type, count=streak_count),
        )


class GameService:
    """Service for game-related operations."""

    @staticmethod
    def create_game(db: Session, game_data: GameCreate) -> Game:
        """Create a new game."""
        db_game = Game(
            home_team=game_data.home_team,
            away_team=game_data.away_team,
            scheduled_at=game_data.scheduled_at,
            venue=game_data.venue,
            status=GameStatus.UPCOMING,
        )
        db.add(db_game)
        db.commit()
        db.refresh(db_game)
        return db_game

    @staticmethod
    def get_game(db: Session, game_id: int) -> Optional[Game]:
        """Get game by ID."""
        return db.query(Game).filter(Game.id == game_id).first()

    @staticmethod
    def list_games(
        db: Session,
        status: Optional[GameStatusEnum] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Game], int]:
        """List games with optional filtering."""
        query = db.query(Game)

        if status:
            query = query.filter(Game.status == GameStatus(status.value))
        if date_from:
            query = query.filter(Game.scheduled_at >= date_from)
        if date_to:
            query = query.filter(Game.scheduled_at <= date_to)

        total = query.count()
        games = query.order_by(Game.scheduled_at.desc()).offset(offset).limit(limit).all()
        
        return games, total

    @staticmethod
    def update_game(db: Session, game_id: int, game_data: GameUpdate) -> Optional[Game]:
        """Update game details."""
        game = db.query(Game).filter(Game.id == game_id).first()
        if not game:
            return None

        update_data = game_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "status" and value:
                setattr(game, field, GameStatus(value.value))
            else:
                setattr(game, field, value)

        # If game is completed, update prediction correctness
        if game.status == GameStatus.COMPLETED and game.home_score is not None and game.away_score is not None:
            winner = game.home_team if game.home_score > game.away_score else game.away_team
            predictions = db.query(Prediction).filter(Prediction.game_id == game_id).all()
            for prediction in predictions:
                prediction.is_correct = prediction.predicted_winner == winner

        db.commit()
        db.refresh(game)
        return game

    @staticmethod
    def get_game_with_predictions(db: Session, game_id: int):
        """Get game with prediction statistics."""
        game = db.query(Game).filter(Game.id == game_id).first()
        if not game:
            return None

        predictions = db.query(Prediction).filter(Prediction.game_id == game_id).all()
        prediction_count = len(predictions)
        
        home_picks = sum(1 for p in predictions if p.predicted_winner == game.home_team)
        away_picks = prediction_count - home_picks

        home_pct = (home_picks / prediction_count * 100) if prediction_count > 0 else 0.0
        away_pct = (away_picks / prediction_count * 100) if prediction_count > 0 else 0.0

        return {
            **game.__dict__,
            "prediction_count": prediction_count,
            "home_pick_percentage": round(home_pct, 2),
            "away_pick_percentage": round(away_pct, 2),
        }


class PredictionService:
    """Service for prediction-related operations."""

    @staticmethod
    def create_prediction(db: Session, prediction_data: PredictionCreate) -> Prediction:
        """Create a new prediction."""
        db_prediction = Prediction(
            user_id=prediction_data.user_id,
            game_id=prediction_data.game_id,
            predicted_winner=prediction_data.predicted_winner,
            predicted_spread=prediction_data.predicted_spread,
        )
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        return db_prediction

    @staticmethod
    def get_prediction(db: Session, prediction_id: int) -> Optional[Prediction]:
        """Get prediction by ID."""
        return db.query(Prediction).filter(Prediction.id == prediction_id).first()

    @staticmethod
    def get_user_prediction_for_game(db: Session, user_id: int, game_id: int) -> Optional[Prediction]:
        """Check if user already has a prediction for this game."""
        return db.query(Prediction).filter(
            Prediction.user_id == user_id,
            Prediction.game_id == game_id
        ).first()

    @staticmethod
    def list_predictions(
        db: Session,
        user_id: Optional[int] = None,
        game_id: Optional[int] = None,
        is_correct: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Prediction], int]:
        """List predictions with optional filtering."""
        query = db.query(Prediction)

        if user_id is not None:
            query = query.filter(Prediction.user_id == user_id)
        if game_id is not None:
            query = query.filter(Prediction.game_id == game_id)
        if is_correct is not None:
            query = query.filter(Prediction.is_correct == is_correct)

        total = query.count()
        predictions = query.order_by(Prediction.created_at.desc()).offset(offset).limit(limit).all()
        
        return predictions, total

    @staticmethod
    def update_prediction(db: Session, prediction_id: int, prediction_data: PredictionUpdate) -> Optional[Prediction]:
        """Update a prediction."""
        prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
        if not prediction:
            return None

        update_data = prediction_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(prediction, field, value)

        db.commit()
        db.refresh(prediction)
        return prediction

    @staticmethod
    def delete_prediction(db: Session, prediction_id: int) -> bool:
        """Delete a prediction."""
        prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
        if not prediction:
            return False
        
        db.delete(prediction)
        db.commit()
        return True


class LeaderboardService:
    """Service for leaderboard calculations."""

    @staticmethod
    def get_leaderboard(
        db: Session,
        period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
        limit: int = 10,
    ) -> List[LeaderboardEntry]:
        """Get leaderboard for specified time period."""
        from sqlalchemy import Integer, case
        
        # Calculate date filter based on period
        now = datetime.utcnow()
        date_filter = None
        
        if period == LeaderboardPeriod.WEEK:
            date_filter = now - timedelta(days=7)
        elif period == LeaderboardPeriod.MONTH:
            date_filter = now - timedelta(days=30)
        elif period == LeaderboardPeriod.SEASON:
            # Assume NBA season starts in October
            if now.month >= 10:
                date_filter = datetime(now.year, 10, 1)
            else:
                date_filter = datetime(now.year - 1, 10, 1)

        # Build query
        query = db.query(
            User,
            func.count(Prediction.id).label("total"),
            func.sum(case((Prediction.is_correct == True, 1), else_=0)).label("correct")
        ).join(Prediction).filter(Prediction.is_correct.isnot(None))

        if date_filter:
            query = query.filter(Prediction.created_at >= date_filter)

        # Get results
        results = query.group_by(User.id).having(func.count(Prediction.id) >= 5).all()

        # Calculate accuracy and sort
        entries = []
        for user, total, correct in results:
            correct = correct or 0
            accuracy = (correct / total * 100) if total > 0 else 0.0
            entries.append({
                "user": user,
                "total_predictions": total,
                "correct_predictions": correct,
                "accuracy_percentage": round(accuracy, 2),
            })

        # Sort by accuracy (descending), then by total predictions (descending)
        entries.sort(key=lambda x: (-x["accuracy_percentage"], -x["total_predictions"]))

        # Add ranks and limit
        leaderboard = []
        for i, entry in enumerate(entries[:limit], 1):
            leaderboard.append(LeaderboardEntry(
                rank=i,
                user=entry["user"],
                total_predictions=entry["total_predictions"],
                correct_predictions=entry["correct_predictions"],
                accuracy_percentage=entry["accuracy_percentage"],
            ))

        return leaderboard
