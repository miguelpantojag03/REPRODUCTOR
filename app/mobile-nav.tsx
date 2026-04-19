'use client';

import Link from 'next/link';
import { Home, Search, Heart, Clock, Settings } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

const NAV_ITEMS = [
  { href: '/',            label: 'Inicio',    icon: Home,     key: 'home'     },
  { href: '/?q=',         label: 'Buscar',    icon: Search,   key: 'search', isSearch: true },
  { href: '/?liked=true', label: 'Me gusta',  icon: Heart,    key: 'liked'    },
  { href: '/history',     label: 'Historial', icon: Clock,    key: 'history'  },
  { href: '/settings',    label: 'Ajustes',   icon: Settings, key: 'settings' },
];

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLiked = searchParams.get('liked') === 'true';

  const isActive = (href: string) => {
    if (href === '/')            return pathname === '/' && !isLiked;
    if (href === '/?liked=true') return pathname === '/' && isLiked;
    if (href === '/?q=')         return false;
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-dark border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon, key, isSearch }) => {
          const active = isActive(href);

          if (isSearch) {
            return (
              <button
                key={key}
                onClick={() => {
                  const el = document.querySelector('input[type="search"]') as HTMLInputElement;
                  if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                }}
                className="flex flex-col items-center justify-center gap-1 min-w-[56px] text-[#727272] active:text-white transition-colors"
                aria-label={label}
              >
                <Icon className="size-6" strokeWidth={1.75} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={key}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[56px] transition-colors',
                active ? 'text-white' : 'text-[#727272] active:text-white'
              )}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className="size-6"
                strokeWidth={active ? 0 : 1.75}
                fill={active ? 'currentColor' : 'none'}
              />
              <span className={cn('text-[10px] font-medium', active && 'text-white')}>{label}</span>
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
