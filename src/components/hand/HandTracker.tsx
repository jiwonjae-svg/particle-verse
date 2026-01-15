'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore, HandGesture } from '@/store/useAppStore';

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface HandResult {
  multiHandLandmarks: HandLandmark[][];
  multiHandedness: { label: string }[];
}

// MediaPipe 타입
interface MediaPipeHands {
  setOptions: (options: {
    maxNumHands: number;
    modelComplexity: number;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }) => void;
  onResults: (callback: (results: HandResult) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface MediaPipeCamera {
  start: () => Promise<void>;
  stop: () => void;
}

export default function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<MediaPipeHands | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const animationRef = useRef<number>();
  const mountedRef = useRef<boolean>(true);

  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState<string>('');

  const { 
    handSettings, 
    setHandPosition, 
    setCurrentGesture,
  } = useAppStore();

  // 제스처 감지
  const detectGesture = useCallback((landmarks: HandLandmark[]): HandGesture => {
    if (!landmarks || landmarks.length < 21) return 'none';

    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];
    const fingerExtended: boolean[] = [];

    fingerExtended.push(landmarks[4].x < landmarks[3].x);

    for (let i = 1; i < 5; i++) {
      fingerExtended.push(landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y);
    }

    const extendedCount = fingerExtended.filter(Boolean).length;

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const pinchDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2)
    );

    if (pinchDistance < 0.05) {
      return 'pinch';
    }

    if (extendedCount >= 4) {
      return 'open';
    } else if (extendedCount <= 1) {
      return 'closed';
    } else if (fingerExtended[1] && !fingerExtended[2] && !fingerExtended[3] && !fingerExtended[4]) {
      return 'point';
    } else if (fingerExtended[1] && fingerExtended[2] && !fingerExtended[3] && !fingerExtended[4]) {
      return 'peace';
    }

    return 'none';
  }, []);

  // 손 위치를 3D 좌표로 변환
  const landmarkTo3D = useCallback((landmark: HandLandmark): { x: number; y: number; z: number } => {
    const sensitivity = handSettings.sensitivity;
    return {
      x: (landmark.x - 0.5) * 400 * sensitivity,
      y: -(landmark.y - 0.5) * 400 * sensitivity,
      z: -landmark.z * 200 * sensitivity,
    };
  }, [handSettings.sensitivity]);

  // 결과 처리
  const onResults = useCallback((results: HandResult) => {
    if (!canvasRef.current || !mountedRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i]?.label;

        const palmCenter = landmarks[9];
        const position3D = landmarkTo3D(palmCenter);

        if (handedness === 'Left') {
          setHandPosition('left', position3D);
        } else {
          setHandPosition('right', position3D);
        }

        if (handSettings.gestureEnabled) {
          const gesture = detectGesture(landmarks);
          setCurrentGesture(gesture);
        }

        // 디버그 시각화
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvasRef.current.width, 0);

        ctx.fillStyle = handedness === 'Left' ? '#0ea5e9' : '#d946ef';
        for (const landmark of landmarks) {
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvasRef.current.width,
            landmark.y * canvasRef.current.height,
            3,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }

        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20],
          [5, 9], [9, 13], [13, 17]
        ];

        ctx.strokeStyle = handedness === 'Left' ? 'rgba(14, 165, 233, 0.5)' : 'rgba(217, 70, 239, 0.5)';
        ctx.lineWidth = 2;

        for (const [start, end] of connections) {
          ctx.beginPath();
          ctx.moveTo(
            landmarks[start].x * canvasRef.current.width,
            landmarks[start].y * canvasRef.current.height
          );
          ctx.lineTo(
            landmarks[end].x * canvasRef.current.width,
            landmarks[end].y * canvasRef.current.height
          );
          ctx.stroke();
        }

        ctx.restore();
      }
    } else {
      setHandPosition('left', null);
      setHandPosition('right', null);
      setCurrentGesture('none');
    }
  }, [landmarkTo3D, detectGesture, setHandPosition, setCurrentGesture, handSettings.gestureEnabled]);

  // MediaPipe 초기화 - 더 안전한 방법 사용
  useEffect(() => {
    if (!handSettings.enabled) {
      return;
    }

    mountedRef.current = true;
    let cleanupCalled = false;

    const initializeHands = async () => {
      try {
        setInitProgress('Loading MediaPipe...');
        
        // 스크립트 태그로 MediaPipe 로드 (WASM 에러 회피)
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            // 이미 로드된 경우 스킵
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
          });
        };

        // MediaPipe 스크립트 순차 로드 (jsdelivr CDN 사용)
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js');

        if (cleanupCalled || !mountedRef.current) return;

        // 전역 객체에서 MediaPipe 가져오기
        const win = window as unknown as {
          Hands: new (config: { locateFile: (file: string) => string }) => MediaPipeHands;
          Camera: new (
            video: HTMLVideoElement,
            config: { onFrame: () => Promise<void>; width: number; height: number }
          ) => MediaPipeCamera;
        };

        if (!win.Hands || !win.Camera) {
          throw new Error('MediaPipe failed to load');
        }

        if (!videoRef.current || !canvasRef.current) return;

        setInitProgress('Initializing hand detection...');

        // Hands 설정 - 더 안정적인 버전 사용
        const hands = new win.Hands({
          locateFile: (file: string) => {
            // jsdelivr CDN 사용
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        setInitProgress('Starting camera...');

        // 카메라 설정
        const camera = new win.Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current && mountedRef.current) {
              try {
                await handsRef.current.send({ image: videoRef.current });
              } catch (e) {
                // 프레임 전송 에러 무시 (정리 중일 수 있음)
              }
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;
        await camera.start();

        if (mountedRef.current) {
          setIsInitialized(true);
          setCameraError(null);
          setInitProgress('');
        }
      } catch (error) {
        console.error('Hand tracking initialization failed:', error);
        if (mountedRef.current) {
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            setCameraError('Camera permission required. Please allow camera access.');
          } else if (error instanceof DOMException && error.name === 'NotFoundError') {
            setCameraError('No camera found. Please connect a camera.');
          } else {
            setCameraError('Failed to initialize hand tracking. Please refresh and try again.');
          }
        }
      }
    };

    initializeHands();

    return () => {
      cleanupCalled = true;
      mountedRef.current = false;
      
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          // 정리 에러 무시
        }
      }
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          // 정리 에러 무시
        }
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handSettings.enabled, onResults]);

  if (!handSettings.enabled) {
    return null;
  }

  return (
    <>
      {/* 비디오 (숨김) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* 디버그 캔버스 */}
      {isInitialized && (
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className="fixed bottom-4 right-4 w-40 h-30 rounded-lg border border-dark-600 opacity-50 hover:opacity-100 transition-opacity z-50"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {/* 에러 메시지 */}
      {cameraError && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm z-50 max-w-xs">
          {cameraError}
        </div>
      )}

      {/* 로딩 상태 */}
      {!isInitialized && !cameraError && (
        <div className="fixed bottom-4 right-4 bg-dark-800/90 text-white px-4 py-2 rounded-lg text-sm z-50 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {initProgress || 'Initializing camera...'}
        </div>
      )}

      {/* 숨겨진 캔버스 (초기화 전) */}
      {!isInitialized && (
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className="hidden"
        />
      )}
    </>
  );
}
