'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ThemeProvider from '@/components/providers/ThemeProvider';

// 동적 임포트로 코드 스플리팅 최적화
const Scene = dynamic(() => import('@/components/three/Scene'), {
  ssr: false,
  loading: () => <LoadingScreen />
});

const UIOverlay = dynamic(() => import('@/components/ui/UIOverlay'), {
  ssr: false
});

const HandTracker = dynamic(() => import('@/components/hand/HandTracker'), {
  ssr: false
});

export default function Home() {
  return (
    <ThemeProvider>
      <main className="relative w-screen h-screen overflow-hidden bg-black">
        {/* 3D 씬 */}
        <div className="canvas-container">
          <Suspense fallback={<LoadingScreen />}>
            <Scene />
          </Suspense>
        </div>

        {/* 손 추적 */}
        <HandTracker />

        {/* UI 오버레이 */}
        <UIOverlay />
      </main>
    </ThemeProvider>
  );
}
