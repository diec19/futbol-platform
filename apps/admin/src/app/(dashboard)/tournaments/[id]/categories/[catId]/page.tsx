'use client';

import { useParams } from 'next/navigation';
import { CategoryTabs } from '@/components/tournaments/category-tabs';

export default function CategoryPage() {
  const { id: tournamentId, catId } = useParams<{ id: string; catId: string }>();

  return <CategoryTabs tournamentId={tournamentId} categoryId={catId} />;
}
