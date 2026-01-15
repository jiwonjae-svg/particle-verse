'use client';

import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore, ParticleEffect, ColorMode, LightingMode } from '@/store/useAppStore';
import { particleVertexShader, particleFragmentShader } from '@/shaders/particleShaders';

const effectToIndex: Record<ParticleEffect, number> = {
  none: 0,
  wave: 1,
  spiral: 2,
  explode: 3,
  implode: 4,
  noise: 5,
  vortex: 6,
  pulse: 7,
  flow: 8,
  rotate: 9,
  float: 10,
};

const colorModeToIndex: Record<ColorMode, number> = {
  original: 0,
  gradient: 1,
  rainbow: 2,
  monochrome: 3,
  temperature: 4,
};

const lightingModeToIndex: Record<LightingMode, number> = {
  none: 0,
  move: 1,
  expand: 2,
  contract: 3,
  pulse: 4,
  wave: 5,
};

const gestureToIndex: Record<string, number> = {
  none: 0,
  open: 1,
  closed: 2,
  pinch: 3,
  point: 4,
  peace: 5,
};

interface ParticleSystemProps {
  positions: Float32Array;
  colors: Float32Array;
  targetPositions?: Float32Array;
  targetColors?: Float32Array;
}

export default function ParticleSystem({ 
  positions, 
  colors, 
  targetPositions, 
  targetColors 
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const transitionProgressRef = useRef(0);
  const floatOffsetRef = useRef(0);
  const effectTransitionRef = useRef(0);
  const previousEffectRef = useRef<ParticleEffect>('none');
  const previousEffectIntensityRef = useRef(0);
  const effectTransitionStageRef = useRef<'idle' | 'fadeOut' | 'showNone' | 'fadeIn'>('idle');
  const targetEffectRef = useRef<ParticleEffect>('none');
  
  // 색상 트랜지션 refs
  const colorTransitionRef = useRef(1); // 1 = 완료 상태
  const previousColorModeRef = useRef<ColorMode>('original');
  const previousPrimaryColorRef = useRef(new THREE.Color('#0ea5e9'));
  const previousSecondaryColorRef = useRef(new THREE.Color('#d946ef'));
  const smoothPrimaryColorRef = useRef(new THREE.Color('#0ea5e9'));
  const smoothSecondaryColorRef = useRef(new THREE.Color('#d946ef'));
  const smoothColorModeIndexRef = useRef(0); // 부드러운 색상 모드 전환
  
  // 라이팅 트랜지션 refs
  const lightingTransitionRef = useRef(1); // 1 = 완료 상태
  const previousLightingModeRef = useRef<LightingMode>('none');
  const previousLightingSpeedRef = useRef(1);
  const previousLightingIntensityRef = useRef(0.5);
  const previousLightingRadiusRef = useRef(100);
  const smoothLightingSpeedRef = useRef(1);
  const smoothLightingIntensityRef = useRef(0.5);
  const smoothLightingRadiusRef = useRef(100);

  const {
    particleSettings,
    visualSettings,
    handSettings,
    rotationSettings,
    currentEffect,
    effectIntensity,
    leftHand,
    rightHand,
    currentGesture,
    setParticleCount,
  } = useAppStore();

  // 손 제스처 부드러운 트랜지션 ref
  const smoothLeftHandRef = useRef(new THREE.Vector3());
  const smoothRightHandRef = useRef(new THREE.Vector3());
  
  // 손 설정 부드러운 트랜지션 refs
  const smoothHandRadiusRef = useRef(100);
  const smoothAttractionForceRef = useRef(0.5);
  const smoothRepulsionForceRef = useRef(0.5);
  
  // 파티클 설정 부드러운 트랜지션 refs
  const smoothSizeRef = useRef(2);
  const smoothOpacityRef = useRef(0.8);
  const smoothSpeedRef = useRef(1);
  const smoothTurbulenceRef = useRef(0.5);

  // 라이팅 설정 기본값
  const lightingSettings = visualSettings.lightingSettings || {
    mode: 'none' as LightingMode,
    speed: 1,
    intensity: 0.5,
    radius: 100,
  };

  // 이펙트 변경 감지 및 트랜지션 시작
  useEffect(() => {
    if (currentEffect !== previousEffectRef.current && effectTransitionStageRef.current === 'idle') {
      targetEffectRef.current = currentEffect;
      effectTransitionStageRef.current = 'fadeOut';
      effectTransitionRef.current = 0;
    }
    
    if (effectIntensity !== previousEffectIntensityRef.current) {
      previousEffectIntensityRef.current = effectIntensity;
    }
  }, [currentEffect, effectIntensity]);
  
  // 색상 변경 감지 및 트랜지션 시작
  useEffect(() => {
    const currentPrimary = new THREE.Color(visualSettings.primaryColor);
    const currentSecondary = new THREE.Color(visualSettings.secondaryColor);
    
    // 색상 모드가 변경되었거나 색상 값이 변경되었을 경우
    if (
      visualSettings.colorMode !== previousColorModeRef.current ||
      !currentPrimary.equals(previousPrimaryColorRef.current) ||
      !currentSecondary.equals(previousSecondaryColorRef.current)
    ) {
      colorTransitionRef.current = 0;
      previousColorModeRef.current = visualSettings.colorMode;
      previousPrimaryColorRef.current.copy(currentPrimary);
      previousSecondaryColorRef.current.copy(currentSecondary);
    }
  }, [visualSettings.colorMode, visualSettings.primaryColor, visualSettings.secondaryColor]);
  
  // 라이팅 변경 감지 및 트랜지션 시작
  useEffect(() => {
    if (
      lightingSettings.mode !== previousLightingModeRef.current ||
      lightingSettings.speed !== previousLightingSpeedRef.current ||
      lightingSettings.intensity !== previousLightingIntensityRef.current ||
      lightingSettings.radius !== previousLightingRadiusRef.current
    ) {
      lightingTransitionRef.current = 0;
      previousLightingModeRef.current = lightingSettings.mode;
      previousLightingSpeedRef.current = lightingSettings.speed;
      previousLightingIntensityRef.current = lightingSettings.intensity;
      previousLightingRadiusRef.current = lightingSettings.radius;
    }
  }, [lightingSettings.mode, lightingSettings.speed, lightingSettings.intensity, lightingSettings.radius]);

  // 파티클 카운트 업데이트
  useEffect(() => {
    setParticleCount(positions.length / 3);
  }, [positions.length, setParticleCount]);

  // 지오메트리 생성 - 트랜지션을 위한 추가 어트리뷰트 포함
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = positions.length / 3;
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('originalPosition', new THREE.BufferAttribute(positions.slice(), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 타겟 포지션 (트랜지션용)
    const targets = targetPositions || positions.slice();
    geo.setAttribute('targetPosition', new THREE.BufferAttribute(targets, 3));
    
    // 타겟 색상 (트랜지션용)
    const targetCols = targetColors || colors.slice();
    geo.setAttribute('targetColor', new THREE.BufferAttribute(targetCols, 3));
    
    // 랜덤 오프셋 (애니메이션 다양성)
    const randomOffsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      randomOffsets[i] = Math.random();
    }
    geo.setAttribute('randomOffset', new THREE.BufferAttribute(randomOffsets, 1));

    // 바운딩 스피어 계산
    geo.computeBoundingSphere();

    return geo;
  }, [positions, colors, targetPositions, targetColors]);

  // 유니폼 생성
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: particleSettings.size },
      uOpacity: { value: particleSettings.opacity },
      uSpeed: { value: particleSettings.speed },
      uTurbulence: { value: particleSettings.turbulence },
      uEffect: { value: effectToIndex[currentEffect] },
      uEffectIntensity: { value: effectIntensity },
      uColorMode: { value: colorModeToIndex[visualSettings.colorMode] },
      uPrimaryColor: { value: new THREE.Color(visualSettings.primaryColor) },
      uSecondaryColor: { value: new THREE.Color(visualSettings.secondaryColor) },
      uLeftHand: { value: new THREE.Vector3() },
      uRightHand: { value: new THREE.Vector3() },
      uHandRadius: { value: handSettings.interactionRadius },
      uAttractionForce: { value: handSettings.attractionForce },
      uRepulsionForce: { value: handSettings.repulsionForce },
      uGesture: { value: 0 },
      // 회전 유니폼
      uRotateAxisX: { value: rotationSettings.axisX },
      uRotateAxisY: { value: rotationSettings.axisY },
      uRotateAxisZ: { value: rotationSettings.axisZ },
      // 새로운 유니폼
      uLightingMode: { value: lightingModeToIndex[lightingSettings.mode] },
      uLightingSpeed: { value: lightingSettings.speed },
      uLightingIntensity: { value: lightingSettings.intensity },
      uLightingRadius: { value: lightingSettings.radius },
      uTransitionProgress: { value: 0 },
      uFloatOffset: { value: 0 },
      uColorTransitionProgress: { value: 0 },
    }),
    []
  );

  // 유니폼 업데이트
  const updateUniforms = useCallback(() => {
    if (!materialRef.current) return;

    const mat = materialRef.current;
    // 파티클 설정 - useFrame에서 부드럽게 보간됨
    mat.uniforms.uSize.value = smoothSizeRef.current;
    mat.uniforms.uOpacity.value = smoothOpacityRef.current;
    mat.uniforms.uSpeed.value = smoothSpeedRef.current;
    mat.uniforms.uTurbulence.value = smoothTurbulenceRef.current;
    // 이펙트는 useFrame에서 단계별로 처리됨
    
    // 색상 모드는 useFrame에서 부드럽게 보간됨
    mat.uniforms.uColorMode.value = smoothColorModeIndexRef.current;
    // 색상은 useFrame에서 부드럽게 보간됨
    mat.uniforms.uPrimaryColor.value.copy(smoothPrimaryColorRef.current);
    mat.uniforms.uSecondaryColor.value.copy(smoothSecondaryColorRef.current);
    
    // 손 설정 - useFrame에서 부드럽게 보간됨
    mat.uniforms.uHandRadius.value = smoothHandRadiusRef.current;
    mat.uniforms.uAttractionForce.value = smoothAttractionForceRef.current;
    mat.uniforms.uRepulsionForce.value = smoothRepulsionForceRef.current;
    mat.uniforms.uGesture.value = gestureToIndex[currentGesture] || 0;
    
    // 회전 설정
    mat.uniforms.uRotateAxisX.value = rotationSettings.axisX;
    mat.uniforms.uRotateAxisY.value = rotationSettings.axisY;
    mat.uniforms.uRotateAxisZ.value = rotationSettings.axisZ;
    
    // 라이팅 유니폼 - useFrame에서 부드럽게 보간됨
    mat.uniforms.uLightingMode.value = lightingModeToIndex[lightingSettings.mode];
    mat.uniforms.uLightingSpeed.value = smoothLightingSpeedRef.current;
    mat.uniforms.uLightingIntensity.value = smoothLightingIntensityRef.current;
    mat.uniforms.uLightingRadius.value = smoothLightingRadiusRef.current;

    // 손 제스처 업데이트
    if (leftHand && handSettings.enabled) {
      mat.uniforms.uLeftHand.value.set(leftHand.x, leftHand.y, leftHand.z);
    } else {
      mat.uniforms.uLeftHand.value.set(0, 0, 0);
    }

    if (rightHand && handSettings.enabled) {
      mat.uniforms.uRightHand.value.set(rightHand.x, rightHand.y, rightHand.z);
    } else {
      mat.uniforms.uRightHand.value.set(0, 0, 0);
    }
  }, [
    particleSettings,
    visualSettings,
    handSettings,
    currentEffect,
    effectIntensity,
    leftHand,
    rightHand,
    currentGesture,
    lightingSettings,
    rotationSettings,
  ]);

  // 매 프레임 업데이트
  useFrame((state, delta) => {
    if (materialRef.current) {
      const time = state.clock.elapsedTime;
      materialRef.current.uniforms.uTime.value = time;
      
      // 손 제스처 부드러운 보간 (lerp)
      const lerpFactor = Math.min(delta * handSettings.gestureTransitionSpeed * 5, 1);
      
      if (leftHand && handSettings.enabled) {
        const targetLeft = new THREE.Vector3(leftHand.x, leftHand.y, leftHand.z);
        smoothLeftHandRef.current.lerp(targetLeft, lerpFactor);
        materialRef.current.uniforms.uLeftHand.value.copy(smoothLeftHandRef.current);
      } else {
        smoothLeftHandRef.current.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);
        materialRef.current.uniforms.uLeftHand.value.copy(smoothLeftHandRef.current);
      }

      if (rightHand && handSettings.enabled) {
        const targetRight = new THREE.Vector3(rightHand.x, rightHand.y, rightHand.z);
        smoothRightHandRef.current.lerp(targetRight, lerpFactor);
        materialRef.current.uniforms.uRightHand.value.copy(smoothRightHandRef.current);
      } else {
        smoothRightHandRef.current.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);
        materialRef.current.uniforms.uRightHand.value.copy(smoothRightHandRef.current);
      }
      
      // 이펙트 전환: fadeOut -> showNone(구형 잠시 보여주기) -> fadeIn
      if (effectTransitionStageRef.current !== 'idle') {
        effectTransitionRef.current = Math.min(
          effectTransitionRef.current + delta * particleSettings.transitionSpeed * 2,
          1
        );
        
        if (effectTransitionStageRef.current === 'fadeOut') {
          // 현재 이펙트에서 none으로 페이드 아웃
          const fadeOutProgress = effectTransitionRef.current;
          materialRef.current.uniforms.uEffect.value = effectToIndex[previousEffectRef.current];
          materialRef.current.uniforms.uEffectIntensity.value = effectIntensity * (1 - fadeOutProgress);
          
          if (fadeOutProgress >= 1) {
            // 페이드 아웃 완료, none(구형) 상태로 전환
            effectTransitionStageRef.current = 'showNone';
            effectTransitionRef.current = 0;
            previousEffectRef.current = 'none';
            materialRef.current.uniforms.uEffect.value = effectToIndex['none'];
            materialRef.current.uniforms.uEffectIntensity.value = 0;
          }
        } else if (effectTransitionStageRef.current === 'showNone') {
          // none(구형) 상태를 잠시 보여줌
          materialRef.current.uniforms.uEffect.value = effectToIndex['none'];
          materialRef.current.uniforms.uEffectIntensity.value = 0;
          
          if (effectTransitionRef.current >= 0.3) {
            // 구형을 충분히 보여줬으면 fadeIn 시작
            effectTransitionStageRef.current = 'fadeIn';
            effectTransitionRef.current = 0;
          }
        } else if (effectTransitionStageRef.current === 'fadeIn') {
          // none에서 새로운 이펙트로 페이드 인
          const fadeInProgress = effectTransitionRef.current;
          materialRef.current.uniforms.uEffect.value = effectToIndex[targetEffectRef.current];
          materialRef.current.uniforms.uEffectIntensity.value = effectIntensity * fadeInProgress;
          
          if (fadeInProgress >= 1) {
            // 페이드 인 완료
            effectTransitionStageRef.current = 'idle';
            previousEffectRef.current = targetEffectRef.current;
          }
        }
      } else {
        // 전환이 없을 때는 현재 이펙트 유지
        materialRef.current.uniforms.uEffect.value = effectToIndex[currentEffect];
        materialRef.current.uniforms.uEffectIntensity.value = effectIntensity;
      }
      
      // 색상 트랜지션 진행 (샌드아트처럼 부드럽게)
      if (colorTransitionRef.current < 1) {
        colorTransitionRef.current = Math.min(
          colorTransitionRef.current + delta * visualSettings.colorTransitionSpeed * 2,
          1
        );
      }
      
      // 색상 모드 인덱스 보간 (부드럽게 전환)
      const targetColorModeIndex = colorModeToIndex[visualSettings.colorMode];
      const colorModeIndexLerpFactor = Math.min(delta * visualSettings.colorTransitionSpeed * 2, 1);
      smoothColorModeIndexRef.current += (targetColorModeIndex - smoothColorModeIndexRef.current) * colorModeIndexLerpFactor;
      materialRef.current.uniforms.uColorMode.value = smoothColorModeIndexRef.current;
      
      // 색상 보간 (부드럽게 전환)
      const targetPrimary = new THREE.Color(visualSettings.primaryColor);
      const targetSecondary = new THREE.Color(visualSettings.secondaryColor);
      const colorLerpFactor = Math.min(delta * visualSettings.colorTransitionSpeed * 3, 1);
      
      smoothPrimaryColorRef.current.lerp(targetPrimary, colorLerpFactor);
      smoothSecondaryColorRef.current.lerp(targetSecondary, colorLerpFactor);
      
      // 라이팅 트랜지션 진행 (샌드아트처럼 부드럽게)
      if (lightingTransitionRef.current < 1) {
        lightingTransitionRef.current = Math.min(
          lightingTransitionRef.current + delta * particleSettings.transitionSpeed * 2,
          1
        );
      }
      
      // 라이팅 속성 보간 (부드럽게 전환)
      const lightingLerpFactor = Math.min(delta * particleSettings.transitionSpeed * 3, 1);
      
      smoothLightingSpeedRef.current += (lightingSettings.speed - smoothLightingSpeedRef.current) * lightingLerpFactor;
      smoothLightingIntensityRef.current += (lightingSettings.intensity - smoothLightingIntensityRef.current) * lightingLerpFactor;
      smoothLightingRadiusRef.current += (lightingSettings.radius - smoothLightingRadiusRef.current) * lightingLerpFactor;
      
      // 손 설정 보간 (샌드아트처럼 부드럽게)
      const handLerpFactor = Math.min(delta * handSettings.gestureTransitionSpeed * 3, 1);
      
      smoothHandRadiusRef.current += (handSettings.interactionRadius - smoothHandRadiusRef.current) * handLerpFactor;
      smoothAttractionForceRef.current += (handSettings.attractionForce - smoothAttractionForceRef.current) * handLerpFactor;
      smoothRepulsionForceRef.current += (handSettings.repulsionForce - smoothRepulsionForceRef.current) * handLerpFactor;
      
      // 파티클 설정 보간 (샌드아트처럼 부드럽게)
      const particleLerpFactor = Math.min(delta * particleSettings.transitionSpeed * 3, 1);
      
      smoothSizeRef.current += (particleSettings.size - smoothSizeRef.current) * particleLerpFactor;
      smoothOpacityRef.current += (particleSettings.opacity - smoothOpacityRef.current) * particleLerpFactor;
      smoothSpeedRef.current += (particleSettings.speed - smoothSpeedRef.current) * particleLerpFactor;
      smoothTurbulenceRef.current += (particleSettings.turbulence - smoothTurbulenceRef.current) * particleLerpFactor;
      
      // 트랜지션 프로그레스 업데이트
      if (targetPositions) {
        transitionProgressRef.current = Math.min(
          transitionProgressRef.current + delta * particleSettings.transitionSpeed,
          1
        );
        materialRef.current.uniforms.uTransitionProgress.value = transitionProgressRef.current;
      }
      
      // 플로트 효과: 시간 기반의 사인파로 움직임
      if (currentEffect === 'float') {
        floatOffsetRef.current = Math.sin(time * 0.5) * 0.5 + 0.5;
        materialRef.current.uniforms.uFloatOffset.value = floatOffsetRef.current;
      }
    }
    updateUniforms();
  });

  // 타겟이 변경되면 트랜지션 리셋
  useEffect(() => {
    transitionProgressRef.current = 0;
  }, [targetPositions, targetColors]);

  // 정리 작업
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}






