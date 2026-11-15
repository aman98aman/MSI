'use client';

import React from 'react';
import SplashScreen from './SplashScreen';

interface ScreenLoaderProps {
  onLoadingComplete?: () => void;
  minDurationMs?: number;
}

export default function ScreenLoader({
  onLoadingComplete,
  minDurationMs = 1800,
}: ScreenLoaderProps) {
  return <SplashScreen onComplete={onLoadingComplete} minDurationMs={minDurationMs} />;
}
