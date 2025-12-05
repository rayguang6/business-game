import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "../../../../lib/store/gameStore";
import { getWinCondition } from "../../../../lib/game/config";
import { DEFAULT_INDUSTRY_ID, IndustryId } from "../../../../lib/game/types";
import GameButton from '@/app/components/ui/GameButton';
import { saveGameMetrics } from '@/lib/server/actions/leaderboardActions';

const GameOverPopup: React.FC = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const gameOverReason = useGameStore((state) => state.gameOverReason);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const resetAllGame = useGameStore((state) => state.resetAllGame);
  const router = useRouter();
  const hasSavedMetrics = useRef(false);

  // Get all game state for leaderboard
  const metrics = useGameStore((state) => state.metrics);
  const currentMonth = useGameStore((state) => state.currentMonth);
  const gameTime = useGameStore((state) => state.gameTime);
  const username = useGameStore((state) => state.username);
  const customersServed = useGameStore((state) => state.customersServed);
  const customersLeftImpatient = useGameStore((state) => state.customersLeftImpatient);
  const customersServiceFailed = useGameStore((state) => state.customersServiceFailed);

  // Save metrics to leaderboard when game ends
  useEffect(() => {
    if (isGameOver && !hasSavedMetrics.current && username && selectedIndustry) {
      hasSavedMetrics.current = true;
      
      saveGameMetrics({
        username,
        industryId: selectedIndustry.id as IndustryId,
        metrics,
        currentMonth,
        gameTime,
        gameOverReason,
        finalCash: metrics.cash,
        finalExp: metrics.exp,
        finalFreedomScore: metrics.freedomScore,
        totalRevenue: metrics.totalRevenue,
        totalExpenses: metrics.totalExpenses,
        customersServed,
        customersLeftImpatient,
        customersServiceFailed,
      }).catch((error) => {
        console.error('Failed to save game metrics to leaderboard:', error);
        // Don't show error to user - leaderboard save is non-blocking
      });
    }
  }, [
    isGameOver,
    username,
    selectedIndustry,
    metrics,
    currentMonth,
    gameTime,
    gameOverReason,
    customersServed,
    customersLeftImpatient,
    customersServiceFailed,
  ]);

  if (!isGameOver) return null;

  const handleGoHome = () => {
    // Reset all game state and navigate home
    resetAllGame();
    router.push('/');
  };

  const getGameOverMessage = () => {
    if (gameOverReason === 'victory') {
      // Check for custom win condition messages
      const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
      const winCondition = getWinCondition(industryId);

      if (winCondition?.customTitle || winCondition?.customMessage) {
        return {
          title: winCondition.customTitle || '🎉 Mission Accomplished!',
          message: winCondition.customMessage || 'Congratulations! You\'ve successfully completed your business challenge!',
          icon: '🏆',
          color: 'green'
        };
      }

      return {
        title: '🎉 Financial Freedom Achieved!',
        message: 'Congratulations! You\'ve built a sustainable business with part-time hours and consistent profits. You\'ve achieved financial freedom!',
        icon: '🏆',
        color: 'green'
      };
    } else if (gameOverReason === 'cash') {
      return {
        title: '💸 Out of Cash!',
        message: 'Your business has run out of money. You need to manage your finances better to stay afloat.',
        icon: '💰',
        color: 'red'
      };
    } else if (gameOverReason === 'time') {
      return {
        title: '⏰ Out of Time!',
        message: 'You\'ve run out of available time. Manage your time more efficiently to succeed.',
        icon: '⏱️',
        color: 'orange'
      };
    }
    return {
      title: '❌ Game Over',
      message: 'Your business has failed.',
      icon: '🚫',
      color: 'red'
    };
  };

  const { title, message, icon, color } = getGameOverMessage();

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">{icon}</div>
          <h2 className={`text-3xl font-bold mb-4 ${
            color === 'green' ? 'text-green-600' : 
            color === 'orange' ? 'text-orange-600' : 
            'text-red-600'
          }`}>{title}</h2>
          <p className="text-gray-700 mb-8 text-lg">{message}</p>

          <GameButton
            color={color === 'green' ? 'green' : 'blue'}
            fullWidth
            size="sm"
            onClick={handleGoHome}
          >
            🏠 Back to Home
          </GameButton>
        </div>
      </div>
    </div>
  );
};

export default GameOverPopup;

