/**
 * API client tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../src/api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('healthApi', () => {
    it('checks health status', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.health.check();
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.any(Object)
      );
    });
  });

  describe('usersApi', () => {
    it('creates a user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        created_at: new Date().toISOString(),
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await api.users.create({
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
      });

      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('gets a user by ID', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        created_at: new Date().toISOString(),
        total_predictions: 10,
        correct_predictions: 7,
        accuracy_percentage: 70.0,
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await api.users.get(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('gamesApi', () => {
    it('lists games', async () => {
      const mockResponse = {
        games: [],
        total: 0,
        limit: 20,
        offset: 0,
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.games.list();
      expect(result).toEqual(mockResponse);
    });

    it('lists games with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ games: [], total: 0 }),
      });

      await api.games.list({ status: 'upcoming', limit: 5 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=upcoming'),
        expect.any(Object)
      );
    });

    it('creates a game', async () => {
      const mockGame = {
        id: 1,
        home_team: 'Lakers',
        away_team: 'Celtics',
        scheduled_at: new Date().toISOString(),
        status: 'upcoming',
        home_score: null,
        away_score: null,
        venue: 'Test Arena',
        created_at: new Date().toISOString(),
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGame),
      });

      const result = await api.games.create({
        home_team: 'Lakers',
        away_team: 'Celtics',
        scheduled_at: new Date().toISOString(),
        venue: 'Test Arena',
      });

      expect(result).toEqual(mockGame);
    });
  });

  describe('predictionsApi', () => {
    it('creates a prediction', async () => {
      const mockPrediction = {
        id: 1,
        user_id: 1,
        game_id: 1,
        predicted_winner: 'Lakers',
        predicted_spread: 5,
        is_correct: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrediction),
      });

      const result = await api.predictions.create({
        user_id: 1,
        game_id: 1,
        predicted_winner: 'Lakers',
        predicted_spread: 5,
      });

      expect(result).toEqual(mockPrediction);
    });

    it('deletes a prediction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.predictions.delete(1);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('leaderboardApi', () => {
    it('gets leaderboard', async () => {
      const mockLeaderboard = {
        entries: [],
        period: 'all_time',
        updated_at: new Date().toISOString(),
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLeaderboard),
      });

      const result = await api.leaderboard.get();
      expect(result).toEqual(mockLeaderboard);
    });

    it('gets leaderboard with period filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [], period: 'week' }),
      });

      await api.leaderboard.get({ period: 'week' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('period=week'),
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('throws ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ detail: 'User not found' }),
      });

      await expect(api.users.get(999)).rejects.toThrow(ApiError);
    });

    it('ApiError contains status and detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: () => Promise.resolve({ detail: 'Username already exists' }),
      });

      try {
        await api.users.create({ username: 'test', email: 'test@test.com' });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(409);
        expect((error as ApiError).detail).toBe('Username already exists');
      }
    });
  });
});
