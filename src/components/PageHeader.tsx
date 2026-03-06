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
        className="text-white/40 hover:text-white transition-colors p-1 -ml-1"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-white font-black text-2xl">{title}</h1>
    </div>
  );
}
