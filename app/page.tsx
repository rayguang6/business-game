import { redirect } from 'next/navigation';
import Image from 'next/image';
import GameButton from '@/app/components/ui/GameButton';
import { supabaseServer } from '@/lib/server/supabaseServer';

// Welcome page constants
const WELCOME_CONFIG = {
  backgroundImageMobile: "/images/start-screen-bg.png",
  backgroundImageDesktop: "/images/start-screen-bg-desktop.png",
  titleImage: "/images/business-empire-title.png",
  titleAlt: "Business Empire",
  startGameHref: "/select-industry"
} as const;

// Event route protection - redirects users during offline events
async function checkRouteProtection() {
  if (!supabaseServer) return;

  const { data } = await supabaseServer
    .from('route_protection')
    .select('enabled, redirect_target')
    .limit(1)
    .maybeSingle();

  if (data?.enabled && data?.redirect_target) {
    redirect(data.redirect_target);
  }
}

export default async function WelcomePage() {
  // Check route protection for offline events
  await checkRouteProtection();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative"
      style={{
        background: `linear-gradient(to bottom,
          rgba(35, 170, 246, 0.3),
          rgba(16, 87, 218, 0.5)
        )`
      }}
    >
      {/* Background image overlay that loads on top */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-responsive-start"
      />

      {/* Game Buttons - centered on page with top margin */}
      <div className="relative z-10 text-center w-full max-w-2xl mx-auto pb-12 sm:pb-16 md:pb-20 mt-16 sm:mt-20">
        <div className="flex flex-col items-center justify-center gap-4 sm:gap-6">
          <GameButton color="blue" size="lg" href={WELCOME_CONFIG.startGameHref}>
            🚀 Start Game
          </GameButton>
          <GameButton color="gold" size="lg" href="/leaderboard">
            🏆 Leaderboard
          </GameButton>
        </div>
      </div>
    </div>
  );
}