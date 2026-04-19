import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar sesión — Reproductor de Música',
  description: 'Accede a tu biblioteca musical personal.',
};

// This layout intentionally has NO sidebar, player, or nav
// It renders the login page in full screen
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
