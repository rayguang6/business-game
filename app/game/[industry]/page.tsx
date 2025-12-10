import { redirect } from 'next/navigation';
import { loadGlobalSimulationSettings, loadIndustryContent, loadIndustries } from '@/lib/server/loadGameData';
import GameClient from './GameClient';
import { ConfigErrorPage } from '@/app/game/components/ui/ConfigErrorPage';
import type { IndustryId } from '@/lib/game/types';

interface GamePageProps {
  params: Promise<{ industry: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { industry: industryId } = await params;

  try {
    // Load all data in parallel
    const [globalConfig, industryContent, industries] = await Promise.all([
      loadGlobalSimulationSettings(),
      loadIndustryContent(industryId as IndustryId),
      loadIndustries(),
    ]);

    // Check if global config loaded
    if (!globalConfig) {
      return (
        <ConfigErrorPage
          title="Configuration Error"
          message="Failed to load global simulation configuration."
          errorType="database"
          details="Please ensure simulation_config table has data configured for industry_id='global' in the admin panel."
          showRetry={true}
        />
      );
    }

    // Check if industry content loaded
    if (!industryContent) {
      return (
        <ConfigErrorPage
          title="Configuration Error"
          message={`Failed to load content for industry "${industryId}".`}
          errorType="database"
          details="Please ensure the industry has all required content configured in the admin panel."
          showRetry={true}
        />
      );
    }

    // Find industry from industries list
    const industry = industries?.find((i) => i.id === industryId);
    if (!industry) {
      redirect('/select-industry');
    }

    // Check if industry is available
    if (!industry.isAvailable) {
      return (
        <ConfigErrorPage
          title="Industry Not Available"
          message={`The industry "${industry.name}" is not currently available.`}
          errorType="database"
          details="Please select a different industry or contact an administrator."
          showRetry={false}
        />
      );
    }

    // Pass data to client component
    return <GameClient industry={industry} globalConfig={globalConfig} industryContent={industryContent} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorType: 'database' | 'code' | 'unknown' = 
      errorMessage.includes('not found') || 
      errorMessage.includes('not configured') || 
      errorMessage.includes('missing') ||
      errorMessage.includes('admin panel')
        ? 'database'
        : errorMessage.includes('Cannot read') || errorMessage.includes('null')
        ? 'code'
        : 'unknown';

    return (
      <ConfigErrorPage
        title="Configuration Error"
        message={errorMessage}
        errorType={errorType}
        details={errorMessage}
        showRetry={true}
      />
    );
  }
}
