'use client';

import { useState, useEffect } from 'react';
import { Onboarding, hasCompletedOnboarding } from './onboarding';

interface OnboardingWrapperProps {
  libraryArtists: string[];
}

// This renders as an OVERLAY on top of the app — never replaces the page
export function OnboardingWrapper({ libraryArtists }: OnboardingWrapperProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only check after client hydration — avoids SSR mismatch
    if (!hasCompletedOnboarding()) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <Onboarding
      libraryArtists={libraryArtists}
      onComplete={() => setShow(false)}
    />
  );
}
