import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "../../../../lib/store/gameStore";
import { getWinCondition } from "../../../../lib/game/config";
import { DEFAULT_INDUSTRY_ID, IndustryId } from "../../../../lib/game/types";
import GameButton from '@/app/components/ui/GameButton';
import { saveGameResult } from "@/lib/server/actions/gameActions";

const GameOverPopup: React.FC = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const gameOverReason = useGameStore((state) => state.gameOverReason);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const resetAllGame = useGameStore((state) => state.resetAllGame);
  const metrics = useGameStore((state) => state.metrics);
  const currentMonth = useGameStore((state) => state.currentMonth);
  const username = useGameStore((state) => state.username);
  const router = useRouter();
  const hasSavedResult = useRef(false);

  // Save game result when game ends
  useEffect(() => {
    if (isGameOver && !hasSavedResult.current && selectedIndustry && username) {
      hasSavedResult.current = true;
      const industryId = selectedIndustry.id as IndustryId;

      // Save asynchronously - don't block UI
      saveGameResult(
        industryId,
        username,
        metrics.cash,
        metrics.leveragedTimeCapacity, // Use capacity instead of current time
        gameOverReason,
        currentMonth,
      ).catch((error) => {
        console.error('[GameOver] Failed to save leaderboard entry:', error);
        // Silently fail - don't interrupt user experience
      });
    }
  }, [isGameOver, selectedIndustry, username, metrics.cash, metrics.leveragedTimeCapacity, gameOverReason, currentMonth]);

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
    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-3 sm:p-4 max-w-[240px] sm:max-w-[280px] w-full mx-2 border-2 border-gray-200">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{icon}</div>
          <h2 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 ${
            color === 'green' ? 'text-green-600' :
            color === 'orange' ? 'text-orange-600' :
            'text-red-600'
          }`}>{title}</h2>
          <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">{message}</p>

          <GameButton
            color={color === 'green' ? 'green' : 'blue'}
            fullWidth
            size="sm"
            onClick={handleGoHome}
            className="text-sm sm:text-base"
          >
            🏠 Back to Home
          </GameButton>
        </div>
      </div>
    </div>
  );
};

export default GameOverPopup;

