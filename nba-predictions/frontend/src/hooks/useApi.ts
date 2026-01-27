/**
 * Custom hooks for data fetching with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api';
import type {
  GameQueryParams,
  PredictionQueryParams,
  LeaderboardQueryParams,
  UserCreate,
  GameCreate,
  GameUpdate,
  PredictionCreate,
  PredictionUpdate,
} from '../types';

// Query key factories
export const queryKeys = {
  health: ['health'] as const,
  users: {
    all: ['users'] as const,
    detail: (id: number) => ['users', id] as const,
    stats: (id: number) => ['users', id, 'stats'] as const,
  },
  games: {
    all: ['games'] as const,
    list: (params: GameQueryParams) => ['games', params] as const,
    detail: (id: number) => ['games', id] as const,
  },
  predictions: {
    all: ['predictions'] as const,
    list: (params: PredictionQueryParams) => ['predictions', params] as const,
    detail: (id: number) => ['predictions', id] as const,
  },
  leaderboard: {
    all: ['leaderboard'] as const,
    byPeriod: (params: LeaderboardQueryParams) => ['leaderboard', params] as const,
  },
};

// ============== Health Hooks ==============

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.health.check(),
    staleTime: 30000, // 30 seconds
  });
}

// ============== User Hooks ==============

export function useUser(userId: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => api.users.get(userId),
    enabled: !!userId,
  });
}

export function useUserStats(userId: number) {
  return useQuery({
    queryKey: queryKeys.users.stats(userId),
    queryFn: () => api.users.getStats(userId),
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UserCreate) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ============== Game Hooks ==============

export function useGames(params: GameQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.games.list(params),
    queryFn: () => api.games.list(params),
  });
}

export function useGame(gameId: number) {
  return useQuery({
    queryKey: queryKeys.games.detail(gameId),
    queryFn: () => api.games.get(gameId),
    enabled: !!gameId,
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: GameCreate) => api.games.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
    },
  });
}

export function useUpdateGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, data }: { gameId: number; data: GameUpdate }) =>
      api.games.update(gameId, data),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.all });
    },
  });
}

// ============== Prediction Hooks ==============

export function usePredictions(params: PredictionQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.predictions.list(params),
    queryFn: () => api.predictions.list(params),
  });
}

export function usePrediction(predictionId: number) {
  return useQuery({
    queryKey: queryKeys.predictions.detail(predictionId),
    queryFn: () => api.predictions.get(predictionId),
    enabled: !!predictionId,
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PredictionCreate) => api.predictions.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.detail(variables.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.user_id) });
    },
  });
}

export function useUpdatePrediction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ predictionId, data }: { predictionId: number; data: PredictionUpdate }) =>
      api.predictions.update(predictionId, data),
    onSuccess: (_, { predictionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions.detail(predictionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all });
    },
  });
}

export function useDeletePrediction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (predictionId: number) => api.predictions.delete(predictionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
    },
  });
}

// ============== Leaderboard Hooks ==============

export function useLeaderboard(params: LeaderboardQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.leaderboard.byPeriod(params),
    queryFn: () => api.leaderboard.get(params),
    staleTime: 60000, // 1 minute
  });
}

// Export hook to check if API error
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
