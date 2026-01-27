/**
 * Frontend component tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LoadingSpinner,
  ErrorMessage,
  GameCard,
  LeaderboardTable,
  UserStatsCard,
  PredictionModal,
} from '../src/components';
import type { Game, LeaderboardEntry, UserWithStats } from '../src/types';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(document.querySelector('.w-4')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(document.querySelector('.w-12')).toBeInTheDocument();
  });
});

describe('ErrorMessage', () => {
  it('displays the error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});

describe('GameCard', () => {
  const mockGame: Game = {
    id: 1,
    home_team: 'Lakers',
    away_team: 'Celtics',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: 'upcoming',
    home_score: null,
    away_score: null,
    venue: 'Crypto.com Arena',
    created_at: new Date().toISOString(),
  };

  it('renders game information', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('Lakers')).toBeInTheDocument();
    expect(screen.getByText('Celtics')).toBeInTheDocument();
    expect(screen.getByText('Crypto.com Arena')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('shows predict button for upcoming games', () => {
    const onPredict = vi.fn();
    render(<GameCard game={mockGame} onPredict={onPredict} />);
    
    const button = screen.getByText('Make Prediction');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(onPredict).toHaveBeenCalledWith(mockGame);
  });

  it('shows scores for completed games', () => {
    const completedGame: Game = {
      ...mockGame,
      status: 'completed',
      home_score: 110,
      away_score: 105,
    };
    
    render(<GameCard game={completedGame} />);
    expect(screen.getByText('110')).toBeInTheDocument();
    expect(screen.getByText('105')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
  });

  it('shows user prediction if provided', () => {
    const prediction = {
      id: 1,
      user_id: 1,
      game_id: 1,
      predicted_winner: 'Lakers',
      predicted_spread: 5,
      is_correct: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    render(<GameCard game={mockGame} userPrediction={prediction} />);
    expect(screen.getByText(/Your pick:/)).toBeInTheDocument();
    expect(screen.getByText('Lakers')).toBeInTheDocument();
  });
});

describe('LeaderboardTable', () => {
  const mockEntries: LeaderboardEntry[] = [
    {
      rank: 1,
      user: {
        id: 1,
        username: 'top_predictor',
        email: 'top@example.com',
        display_name: 'Top Predictor',
        created_at: new Date().toISOString(),
      },
      total_predictions: 50,
      correct_predictions: 40,
      accuracy_percentage: 80.0,
    },
    {
      rank: 2,
      user: {
        id: 2,
        username: 'second_best',
        email: 'second@example.com',
        display_name: null,
        created_at: new Date().toISOString(),
      },
      total_predictions: 30,
      correct_predictions: 21,
      accuracy_percentage: 70.0,
    },
  ];

  it('renders leaderboard entries', () => {
    render(<LeaderboardTable entries={mockEntries} />);
    expect(screen.getByText('Top Predictor')).toBeInTheDocument();
    expect(screen.getByText('second_best')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText('70.0%')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<LeaderboardTable entries={[]} />);
    expect(screen.getByText(/No leaderboard data/)).toBeInTheDocument();
  });

  it('highlights current user', () => {
    const { container } = render(<LeaderboardTable entries={mockEntries} currentUserId={1} />);
    const highlightedRow = container.querySelector('.bg-orange-50');
    expect(highlightedRow).toBeInTheDocument();
  });
});

describe('UserStatsCard', () => {
  const mockUser: UserWithStats = {
    id: 1,
    username: 'test_user',
    email: 'test@example.com',
    display_name: 'Test User',
    created_at: new Date().toISOString(),
    total_predictions: 100,
    correct_predictions: 65,
    accuracy_percentage: 65.0,
  };

  it('renders user information', () => {
    render(<UserStatsCard user={mockUser} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@test_user')).toBeInTheDocument();
  });

  it('shows statistics', () => {
    render(<UserStatsCard user={mockUser} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('65.0%')).toBeInTheDocument();
  });
});

describe('PredictionModal', () => {
  const mockGame: Game = {
    id: 1,
    home_team: 'Lakers',
    away_team: 'Celtics',
    scheduled_at: new Date().toISOString(),
    status: 'upcoming',
    home_score: null,
    away_score: null,
    venue: null,
    created_at: new Date().toISOString(),
  };

  it('renders team options', () => {
    render(
      <PredictionModal
        game={mockGame}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText('Lakers')).toBeInTheDocument();
    expect(screen.getByText('Celtics')).toBeInTheDocument();
  });

  it('calls onSubmit with selected team', () => {
    const onSubmit = vi.fn();
    render(
      <PredictionModal
        game={mockGame}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    );
    
    // Select a team
    fireEvent.click(screen.getByText('Lakers'));
    
    // Submit
    fireEvent.click(screen.getByText('Submit Prediction'));
    
    expect(onSubmit).toHaveBeenCalledWith('Lakers', undefined);
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(
      <PredictionModal
        game={mockGame}
        onSubmit={vi.fn()}
        onClose={onClose}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
