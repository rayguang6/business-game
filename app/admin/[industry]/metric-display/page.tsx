import { loadIndustries } from '@/lib/server/loadGameData';
import IndustryMetricDisplayPageClient from '../industry-metric-display/IndustryMetricDisplayPageClient';

interface IndustryMetricDisplayPageProps {
  params: Promise<{ industry: string }>;
}

export default async function IndustryMetricDisplayPage({ params }: IndustryMetricDisplayPageProps) {
  const { industry } = await params;
  const industries = await loadIndustries();
  
  return <IndustryMetricDisplayPageClient industry={industry} industries={industries || []} />;
}
