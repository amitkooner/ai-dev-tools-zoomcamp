/**
 * Reusable UI components for NBA Predictions application.
 */

import React from 'react';
import type { Game, Prediction, LeaderboardEntry, UserWithStats } from '../types';

// ============== Loading Spinner ==============

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center p-4">
      <div
        className={`${sizeClasses[size]} border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin`}
      />
    </div>
  );
}

// ============== Error Message ==============

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      <p className="font-medium">Error</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ============== Game Card ==============

interface GameCardProps {
  game: Game;
  onPredict?: (game: Game) => void;
  userPrediction?: Prediction;
}

export function GameCard({ game, onPredict, userPrediction }: GameCardProps) {
  const gameDate = new Date(game.scheduled_at);
  const isCompleted = game.status === 'completed';
  const isUpcoming = game.status === 'upcoming';

  const getStatusBadge = () => {
    switch (game.status) {
      case 'upcoming':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Upcoming</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full animate-pulse">Live</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Final</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm text-gray-500">
          {gameDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Away Team */}
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-gray-800">{game.away_team}</div>
          {isCompleted && (
            <div className="text-3xl font-bold text-gray-900 mt-2">{game.away_score}</div>
          )}
        </div>

        {/* VS / Score Divider */}
        <div className="text-gray-400 font-medium">
          {isCompleted ? '-' : '@'}
        </div>

        {/* Home Team */}
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-gray-800">{game.home_team}</div>
          {isCompleted && (
            <div className="text-3xl font-bold text-gray-900 mt-2">{game.home_score}</div>
          )}
        </div>
      </div>

      {game.venue && (
        <div className="text-sm text-gray-500 text-center mt-4">{game.venue}</div>
      )}

      {/* User's Prediction */}
      {userPrediction && (
        <div className={`mt-4 p-3 rounded-lg text-center ${
          userPrediction.is_correct === true
            ? 'bg-green-50 border border-green-200'
            : userPrediction.is_correct === false
            ? 'bg-red-50 border border-red-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <span className="text-sm">Your pick: </span>
          <span className="font-semibold">{userPrediction.predicted_winner}</span>
          {userPrediction.predicted_spread && (
            <span className="text-sm text-gray-600"> by {userPrediction.predicted_spread}</span>
          )}
          {userPrediction.is_correct !== null && (
            <span className={`ml-2 ${userPrediction.is_correct ? 'text-green-600' : 'text-red-600'}`}>
              {userPrediction.is_correct ? '✓ Correct' : '✗ Wrong'}
            </span>
          )}
        </div>
      )}

      {/* Predict Button */}
      {isUpcoming && onPredict && !userPrediction && (
        <button
          onClick={() => onPredict(game)}
          className="w-full mt-4 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
        >
          Make Prediction
        </button>
      )}
    </div>
  );
}

// ============== Leaderboard Table ==============

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: number;
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No leaderboard data available yet. Make some predictions!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Predictions</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Correct</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.user.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                entry.user.id === currentUserId ? 'bg-orange-50' : ''
              }`}
            >
              <td className="py-3 px-4">
                {entry.rank <= 3 ? (
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                    entry.rank === 1
                      ? 'bg-yellow-400 text-yellow-900'
                      : entry.rank === 2
                      ? 'bg-gray-300 text-gray-700'
                      : 'bg-orange-300 text-orange-900'
                  }`}>
                    {entry.rank}
                  </span>
                ) : (
                  <span className="text-gray-600">{entry.rank}</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">
                  {entry.user.display_name || entry.user.username}
                </div>
                {entry.user.display_name && (
                  <div className="text-sm text-gray-500">@{entry.user.username}</div>
                )}
              </td>
              <td className="py-3 px-4 text-center text-gray-700">{entry.total_predictions}</td>
              <td className="py-3 px-4 text-center text-gray-700">{entry.correct_predictions}</td>
              <td className="py-3 px-4 text-center">
                <span className={`font-semibold ${
                  entry.accuracy_percentage >= 70
                    ? 'text-green-600'
                    : entry.accuracy_percentage >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {entry.accuracy_percentage.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============== User Stats Card ==============

interface UserStatsCardProps {
  user: UserWithStats;
}

export function UserStatsCard({ user }: UserStatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-orange-600">
            {(user.display_name || user.username).charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {user.display_name || user.username}
          </h2>
          {user.display_name && (
            <p className="text-gray-500">@{user.username}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{user.total_predictions}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{user.correct_predictions}</div>
          <div className="text-sm text-gray-500">Correct</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {user.accuracy_percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Accuracy</div>
        </div>
      </div>
    </div>
  );
}

// ============== Prediction Modal ==============

interface PredictionModalProps {
  game: Game;
  onSubmit: (winner: string, spread?: number) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function PredictionModal({ game, onSubmit, onClose, isLoading }: PredictionModalProps) {
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);
  const [spread, setSpread] = React.useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeam) {
      onSubmit(selectedTeam, spread ? parseInt(spread, 10) : undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Make Your Prediction</h3>
        
        <div className="text-center mb-6">
          <span className="text-gray-600">{game.away_team}</span>
          <span className="mx-4 text-gray-400">@</span>
          <span className="text-gray-600">{game.home_team}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pick the winner:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedTeam(game.away_team)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedTeam === game.away_team
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {game.away_team}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTeam(game.home_team)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedTeam === game.home_team
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {game.home_team}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Point spread (optional):
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={spread}
                onChange={(e) => setSpread(e.target.value)}
                placeholder="e.g., 7"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTeam || isLoading}
              className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Submit Prediction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============== Navigation ==============

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isActive?: boolean;
}

export function NavLink({ to, children, isActive }: NavLinkProps) {
  return (
    <a
      href={to}
      className={`px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-orange-100 text-orange-700 font-medium'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </a>
  );
}
