'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  backHref?: string;
}

export function PageHeader({ title, backHref = '/' }: PageHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 pt-20 pb-6">
      <button
        onClick={() => router.push(backHref)}
        className="-ml-1 p-1 text-white/40 transition-colors hover:text-white"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-2xl font-black text-white">{title}</h1>
    </div>
  );
}
