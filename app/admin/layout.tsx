import { loadIndustries } from '@/lib/server/loadGameData';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const industries = await loadIndustries();
  
  return <AdminLayoutClient industries={industries || []}>{children}</AdminLayoutClient>;
}
