'use client';

import { useState, useEffect } from 'react';
import { Onboarding, hasCompletedOnboarding, getStoredFavoriteArtists } from './onboarding';

interface OnboardingWrapperProps {
  children: React.ReactNode;
  libraryArtists: string[];
}

export function OnboardingWrapper({ children, libraryArtists }: OnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check after hydration
    const done = hasCompletedOnboarding();
    setShowOnboarding(!done);
    setReady(true);
  }, []);

  if (!ready) {
    // Avoid flash — render children immediately on SSR
    return <>{children}</>;
  }

  if (showOnboarding) {
    return (
      <Onboarding
        libraryArtists={libraryArtists}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return <>{children}</>;
}
