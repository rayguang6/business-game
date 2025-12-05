import { loadIndustries } from '@/lib/server/loadGameData';
import IndustryConfigPageClient from './IndustryConfigPageClient';

interface IndustryConfigPageProps {
  params: Promise<{ industry: string }>;
}

export default async function IndustryConfigPage({ params }: IndustryConfigPageProps) {
  const { industry } = await params;
  const industries = await loadIndustries();
  
  return <IndustryConfigPageClient industry={industry} industries={industries || []} />;
}
