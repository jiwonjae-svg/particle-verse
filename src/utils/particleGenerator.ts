/**
 * 파티클 생성 유틸리티
 * 이미지, 텍스트, 3D 모델에서 파티클 데이터를 생성
 */

// 기본 파티클 생성 (구형 분포)
export function generateDefaultParticles(count: number): {
  positions: Float32Array;
  colors: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // 구형 분포
    const radius = Math.random() * 150;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // 그라데이션 색상
    const t = radius / 150;
    colors[i3] = 0.05 + t * 0.5; // R
    colors[i3 + 1] = 0.4 + t * 0.4; // G
    colors[i3 + 2] = 0.9; // B
  }

  return { positions, colors };
}

// 이미지에서 파티클 생성
export async function generateParticlesFromImage(
  imageUrl: string,
  maxParticles: number
): Promise<{ positions: Float32Array; colors: Float32Array }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 캔버스 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 컨텍스트를 가져올 수 없습니다.'));
        return;
      }

      // 이미지 크기 조절 (성능 최적화)
      const maxSize = 256;
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // 픽셀 데이터 추출
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      // 유효한 픽셀 수집 (투명하지 않은 픽셀)
      const validPixels: { x: number; y: number; r: number; g: number; b: number }[] = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // 투명도와 밝기 체크
          if (a > 50) {
            validPixels.push({
              x: x - width / 2,
              y: -(y - height / 2),
              r: r / 255,
              g: g / 255,
              b: b / 255,
            });
          }
        }
      }

      // 샘플링
      const particleCount = Math.min(maxParticles, validPixels.length);
      const step = Math.max(1, Math.floor(validPixels.length / particleCount));

      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const scale = 2; // 스케일 팩터

      for (let i = 0; i < particleCount; i++) {
        const pixel = validPixels[Math.min(i * step, validPixels.length - 1)];
        const i3 = i * 3;

        // 위치 (약간의 깊이 랜덤)
        positions[i3] = pixel.x * scale;
        positions[i3 + 1] = pixel.y * scale;
        positions[i3 + 2] = (Math.random() - 0.5) * 30;

        // 색상
        colors[i3] = pixel.r;
        colors[i3 + 1] = pixel.g;
        colors[i3 + 2] = pixel.b;
      }

      resolve({ positions, colors });
    };

    img.onerror = () => {
      reject(new Error('이미지 로딩 실패'));
    };

    img.src = imageUrl;
  });
}

// 텍스트에서 파티클 생성
export function generateTextParticles(
  text: string,
  maxParticles: number
): { positions: Float32Array; colors: Float32Array } {
  // 캔버스에 텍스트 렌더링
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return generateDefaultParticles(maxParticles);
  }

  // 캔버스 크기 설정
  const fontSize = 120;
  ctx.font = `bold ${fontSize}px Arial`;
  const metrics = ctx.measureText(text);
  const textWidth = Math.min(metrics.width, 800);
  const textHeight = fontSize * 1.5;

  canvas.width = textWidth + 40;
  canvas.height = textHeight + 40;

  // 텍스트 렌더링
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // 픽셀 데이터 추출
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // 흰색 픽셀 수집
  const validPixels: { x: number; y: number }[] = [];

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

      if (brightness > 128) {
        validPixels.push({
          x: x - canvas.width / 2,
          y: -(y - canvas.height / 2),
        });
      }
    }
  }

  // 샘플링
  const particleCount = Math.min(maxParticles, validPixels.length);
  const step = Math.max(1, Math.floor(validPixels.length / particleCount));

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const scale = 1.5;

  for (let i = 0; i < particleCount; i++) {
    const pixel = validPixels[Math.min(i * step, validPixels.length - 1)];
    const i3 = i * 3;

    positions[i3] = pixel.x * scale;
    positions[i3 + 1] = pixel.y * scale;
    positions[i3 + 2] = (Math.random() - 0.5) * 20;

    // 그라데이션 색상
    const t = (pixel.x + canvas.width / 2) / canvas.width;
    colors[i3] = 0.1 + t * 0.8;
    colors[i3 + 1] = 0.6;
    colors[i3 + 2] = 1.0 - t * 0.3;
  }

  return { positions, colors };
}

// 3D 모델에서 파티클 생성 (GLTF/GLB)
export async function generateParticlesFromModel(
  modelUrl: string,
  maxParticles: number
): Promise<{ positions: Float32Array; colors: Float32Array }> {
  // GLTFLoader를 동적으로 import
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      modelUrl,
      (gltf) => {
        const positions: number[] = [];
        const colors: number[] = [];

        // 모든 메시에서 버텍스 추출
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const geometry = mesh.geometry;
            const positionAttr = geometry.getAttribute('position');
            const colorAttr = geometry.getAttribute('color');

            for (let i = 0; i < positionAttr.count; i++) {
              // 월드 좌표로 변환
              const vertex = new THREE.Vector3(
                positionAttr.getX(i),
                positionAttr.getY(i),
                positionAttr.getZ(i)
              );
              vertex.applyMatrix4(mesh.matrixWorld);

              positions.push(vertex.x * 50, vertex.y * 50, vertex.z * 50);

              // 색상
              if (colorAttr) {
                colors.push(
                  colorAttr.getX(i),
                  colorAttr.getY(i),
                  colorAttr.getZ(i)
                );
              } else {
                colors.push(0.5, 0.7, 1.0);
              }
            }
          }
        });

        // 샘플링
        const particleCount = Math.min(maxParticles, positions.length / 3);
        const step = Math.max(1, Math.floor(positions.length / 3 / particleCount));

        const sampledPositions = new Float32Array(particleCount * 3);
        const sampledColors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          const srcIdx = i * step * 3;
          const dstIdx = i * 3;

          sampledPositions[dstIdx] = positions[srcIdx];
          sampledPositions[dstIdx + 1] = positions[srcIdx + 1];
          sampledPositions[dstIdx + 2] = positions[srcIdx + 2];

          sampledColors[dstIdx] = colors[srcIdx];
          sampledColors[dstIdx + 1] = colors[srcIdx + 1];
          sampledColors[dstIdx + 2] = colors[srcIdx + 2];
        }

        resolve({ positions: sampledPositions, colors: sampledColors });
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

// THREE 네임스페이스 임포트
import * as THREE from 'three';
