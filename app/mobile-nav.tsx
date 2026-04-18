'use client';

import Link from 'next/link';
import { Home, Search, Library, Clock } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLiked = searchParams.get('liked') === 'true';

  const items = [
    {
      href: '/',
      label: 'Inicio',
      icon: Home,
      active: pathname === '/' && !isLiked,
    },
    {
      href: '/?q=',
      label: 'Buscar',
      icon: Search,
      active: false,
      isSearch: true,
    },
    {
      href: '/?liked=true',
      label: 'Me gusta',
      icon: Library,
      active: pathname === '/' && isLiked,
    },
    {
      href: '/history',
      label: 'Historial',
      icon: Clock,
      active: pathname === '/history',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/95 backdrop-blur-md border-t border-white/5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16">
        {items.map(({ href, label, icon: Icon, active, isSearch }) => {
          if (isSearch) {
            return (
              <button
                key={label}
                onClick={() => {
                  const el = document.querySelector('input[type="search"]') as HTMLInputElement;
                  if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth' }); }
                }}
                className="flex flex-col items-center justify-center gap-1 w-16 text-[#b3b3b3] active:text-white transition-colors"
              >
                <Icon className="size-6" strokeWidth={2} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          }
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-16 transition-colors',
                active ? 'text-white' : 'text-[#b3b3b3] active:text-white'
              )}
            >
              <Icon
                className="size-6"
                strokeWidth={active ? 0 : 2}
                fill={active ? 'currentColor' : 'none'}
              />
              <span className={cn('text-[10px] font-medium', active ? 'text-white' : '')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileNav() {
  return (
    <Suspense fallback={null}>
      <MobileNavContent />
    </Suspense>
  );
}
