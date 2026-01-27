/**
 * Page components for NBA Predictions application.
 */

import React from 'react';
import {
  LoadingSpinner,
  ErrorMessage,
  GameCard,
  LeaderboardTable,
  UserStatsCard,
  PredictionModal,
} from '../components';
import {
  useGames,
  useLeaderboard,
  useUser,
  usePredictions,
  useCreatePrediction,
} from '../hooks';
import type { Game, LeaderboardPeriod } from '../types';

// ============== Home Page ==============

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl text-white">
        <h1 className="text-4xl font-bold mb-4">NBA Game Predictions</h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          Predict game outcomes, track your accuracy, and compete with other fans
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Games</h2>
          <UpcomingGamesPreview />
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Predictors</h2>
          <LeaderboardPreview />
        </section>
      </div>
    </div>
  );
}

function UpcomingGamesPreview() {
  const { data, isLoading, error } = useGames({ status: 'upcoming', limit: 3 });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load games" />;
  if (!data?.games.length) {
    return <p className="text-gray-500">No upcoming games scheduled</p>;
  }

  return (
    <div className="space-y-4">
      {data.games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
      <a
        href="/games"
        className="block text-center text-orange-600 hover:text-orange-700 font-medium"
      >
        View all games →
      </a>
    </div>
  );
}

function LeaderboardPreview() {
  const { data, isLoading, error } = useLeaderboard({ limit: 5 });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load leaderboard" />;
  if (!data?.entries.length) {
    return <p className="text-gray-500">No predictions yet. Be the first!</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <LeaderboardTable entries={data.entries} />
      <a
        href="/leaderboard"
        className="block text-center text-orange-600 hover:text-orange-700 font-medium mt-4"
      >
        View full leaderboard →
      </a>
    </div>
  );
}

// ============== Games Page ==============

export function GamesPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [selectedGame, setSelectedGame] = React.useState<Game | null>(null);
  
  // In a real app, this would come from auth context
  const currentUserId = 1;
  
  const { data: gamesData, isLoading, error } = useGames(
    statusFilter === 'all' ? {} : { status: statusFilter as any }
  );
  
  const { data: predictionsData } = usePredictions({ user_id: currentUserId });
  const createPrediction = useCreatePrediction();

  const userPredictions = React.useMemo(() => {
    if (!predictionsData) return {};
    return predictionsData.predictions.reduce((acc, pred) => {
      acc[pred.game_id] = pred;
      return acc;
    }, {} as Record<number, typeof predictionsData.predictions[0]>);
  }, [predictionsData]);

  const handlePredictionSubmit = (winner: string, spread?: number) => {
    if (!selectedGame) return;
    
    createPrediction.mutate(
      {
        user_id: currentUserId,
        game_id: selectedGame.id,
        predicted_winner: winner,
        predicted_spread: spread,
      },
      {
        onSuccess: () => setSelectedGame(null),
      }
    );
  };

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message="Failed to load games" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Games</h1>
        
        <div className="flex gap-2">
          {['all', 'upcoming', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {!gamesData?.games.length ? (
        <p className="text-gray-500 text-center py-8">No games found</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gamesData.games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPredict={setSelectedGame}
              userPrediction={userPredictions[game.id]}
            />
          ))}
        </div>
      )}

      {selectedGame && (
        <PredictionModal
          game={selectedGame}
          onSubmit={handlePredictionSubmit}
          onClose={() => setSelectedGame(null)}
          isLoading={createPrediction.isPending}
        />
      )}
    </div>
  );
}

// ============== Leaderboard Page ==============

export function LeaderboardPage() {
  const [period, setPeriod] = React.useState<LeaderboardPeriod>('all_time');
  const { data, isLoading, error } = useLeaderboard({ period, limit: 50 });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message="Failed to load leaderboard" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        
        <div className="flex gap-2">
          {(['all_time', 'season', 'month', 'week'] as LeaderboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === p
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <LeaderboardTable entries={data?.entries || []} />
      </div>
    </div>
  );
}

// ============== Profile Page ==============

export function ProfilePage() {
  // In a real app, this would come from auth context or URL params
  const userId = 1;
  
  const { data: user, isLoading: userLoading, error: userError } = useUser(userId);
  const { data: predictions, isLoading: predictionsLoading } = usePredictions({ user_id: userId });

  if (userLoading) return <LoadingSpinner size="lg" />;
  if (userError) return <ErrorMessage message="Failed to load profile" />;
  if (!user) return <ErrorMessage message="User not found" />;

  return (
    <div className="space-y-8">
      <UserStatsCard user={user} />

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Predictions</h2>
        
        {predictionsLoading ? (
          <LoadingSpinner />
        ) : !predictions?.predictions.length ? (
          <p className="text-gray-500">No predictions yet</p>
        ) : (
          <div className="space-y-4">
            {predictions.predictions.slice(0, 10).map((prediction) => (
              <div
                key={prediction.id}
                className={`p-4 rounded-lg border ${
                  prediction.is_correct === true
                    ? 'bg-green-50 border-green-200'
                    : prediction.is_correct === false
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {prediction.game?.away_team} @ {prediction.game?.home_team}
                    </span>
                    <span className="text-gray-500 ml-4">
                      Pick: {prediction.predicted_winner}
                    </span>
                  </div>
                  <div>
                    {prediction.is_correct === true && (
                      <span className="text-green-600 font-medium">✓ Correct</span>
                    )}
                    {prediction.is_correct === false && (
                      <span className="text-red-600 font-medium">✗ Wrong</span>
                    )}
                    {prediction.is_correct === null && (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ============== Not Found Page ==============

export function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Go Home
      </a>
    </div>
  );
}
