/**
 * TypeScript type definitions matching OpenAPI specification.
 */

// Enums
export type GameStatus = 'upcoming' | 'in_progress' | 'completed';
export type LeaderboardPeriod = 'all_time' | 'season' | 'month' | 'week';

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  display_name?: string;
}

export interface UserWithStats extends User {
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
}

export interface TeamAccuracy {
  team: string;
  predictions: number;
  correct: number;
  accuracy: number;
}

export interface StreakInfo {
  type: 'winning' | 'losing' | 'none';
  count: number;
}

export interface UserStats {
  user_id: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
  predictions_by_team: TeamAccuracy[];
  recent_form: boolean[];
  streak: StreakInfo;
}

// Game types
export interface Game {
  id: number;
  home_team: string;
  away_team: string;
  scheduled_at: string;
  status: GameStatus;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  created_at: string;
}

export interface GameCreate {
  home_team: string;
  away_team: string;
  scheduled_at: string;
  venue?: string;
}

export interface GameUpdate {
  status?: GameStatus;
  home_score?: number;
  away_score?: number;
  scheduled_at?: string;
}

export interface GameWithPredictions extends Game {
  prediction_count: number;
  home_pick_percentage: number;
  away_pick_percentage: number;
}

export interface GameListResponse {
  games: Game[];
  total: number;
  limit: number;
  offset: number;
}

// Prediction types
export interface Prediction {
  id: number;
  user_id: number;
  game_id: number;
  predicted_winner: string;
  predicted_spread: number | null;
  is_correct: boolean | null;
  created_at: string;
  updated_at: string;
  game?: Game;
}

export interface PredictionCreate {
  user_id: number;
  game_id: number;
  predicted_winner: string;
  predicted_spread?: number;
}

export interface PredictionUpdate {
  predicted_winner?: string;
  predicted_spread?: number;
}

export interface PredictionListResponse {
  predictions: Prediction[];
  total: number;
  limit: number;
  offset: number;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  user: User;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
  updated_at: string;
}

// Health check
export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

// Error response
export interface ErrorResponse {
  detail: string;
}

// Query parameters
export interface GameQueryParams {
  status?: GameStatus;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface PredictionQueryParams {
  user_id?: number;
  game_id?: number;
  is_correct?: boolean;
  limit?: number;
  offset?: number;
}

export interface LeaderboardQueryParams {
  period?: LeaderboardPeriod;
  limit?: number;
}
