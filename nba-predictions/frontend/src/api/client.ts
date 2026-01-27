/**
 * Centralized API client for NBA Predictions application.
 * All backend communication flows through this module.
 */

import type {
  User,
  UserCreate,
  UserWithStats,
  UserStats,
  Game,
  GameCreate,
  GameUpdate,
  GameWithPredictions,
  GameListResponse,
  GameQueryParams,
  Prediction,
  PredictionCreate,
  PredictionUpdate,
  PredictionListResponse,
  PredictionQueryParams,
  Leaderboard,
  LeaderboardQueryParams,
  HealthResponse,
} from '../types';

// Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public detail: string
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      response.statusText,
      errorData.detail || 'An error occurred'
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============== Health API ==============

export const healthApi = {
  check: (): Promise<HealthResponse> => 
    fetchApi('/api/health'),
};

// ============== Users API ==============

export const usersApi = {
  create: (data: UserCreate): Promise<User> =>
    fetchApi('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (userId: number): Promise<UserWithStats> =>
    fetchApi(`/api/users/${userId}`),

  getStats: (userId: number): Promise<UserStats> =>
    fetchApi(`/api/users/${userId}/stats`),
};

// ============== Games API ==============

export const gamesApi = {
  create: (data: GameCreate): Promise<Game> =>
    fetchApi('/api/games', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (params: GameQueryParams = {}): Promise<GameListResponse> =>
    fetchApi(`/api/games${buildQueryString(params)}`),

  get: (gameId: number): Promise<GameWithPredictions> =>
    fetchApi(`/api/games/${gameId}`),

  update: (gameId: number, data: GameUpdate): Promise<Game> =>
    fetchApi(`/api/games/${gameId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============== Predictions API ==============

export const predictionsApi = {
  create: (data: PredictionCreate): Promise<Prediction> =>
    fetchApi('/api/predictions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (params: PredictionQueryParams = {}): Promise<PredictionListResponse> =>
    fetchApi(`/api/predictions${buildQueryString(params)}`),

  get: (predictionId: number): Promise<Prediction> =>
    fetchApi(`/api/predictions/${predictionId}`),

  update: (predictionId: number, data: PredictionUpdate): Promise<Prediction> =>
    fetchApi(`/api/predictions/${predictionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (predictionId: number): Promise<void> =>
    fetchApi(`/api/predictions/${predictionId}`, {
      method: 'DELETE',
    }),
};

// ============== Leaderboard API ==============

export const leaderboardApi = {
  get: (params: LeaderboardQueryParams = {}): Promise<Leaderboard> =>
    fetchApi(`/api/leaderboard${buildQueryString(params)}`),
};

// Export all APIs as a single object for convenience
export const api = {
  health: healthApi,
  users: usersApi,
  games: gamesApi,
  predictions: predictionsApi,
  leaderboard: leaderboardApi,
};

export default api;
