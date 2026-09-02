/**
 * VentureCue — 3D Realistic Human Avatar
 * Built with Three.js for realistic studio-lit human conversational presence.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { AvatarState } from '../../types/session';

interface Human3DAvatarProps {
  state: AvatarState;
  personaId?: string;
  personaName?: string;
}

interface PersonaPalette {
  suitColor: number;
  shirtColor: number;
  tieColor?: number;
  skinColor: number;
  hairColor: number;
  hairStyle: 'short' | 'slick' | 'medium' | 'wavy' | 'crop';
  glasses?: boolean;
  eyeColor: number;
  rimColor: number;
}

const PALETTES: Record<string, PersonaPalette> = {
  skeptic: {
    suitColor: 0x1e293b, // Tailored Navy Blazer
    shirtColor: 0xf8fafc, // Ivory Silk Blouse
    skinColor: 0xdeb394, // Warm Natural Skin Tone
    hairColor: 0x241812, // Rich Brunette
    hairStyle: 'medium',
    glasses: false,
    eyeColor: 0x3d271d,
    rimColor: 0x4f7cff,
  },
  busy: {
    suitColor: 0x262626, // Charcoal Blazer
    shirtColor: 0x0d9488, // Teal Blouse
    skinColor: 0xd9a583,
    hairColor: 0x18181b,
    hairStyle: 'wavy',
    glasses: false,
    eyeColor: 0x22382f,
    rimColor: 0x00cba8,
  },
  talkative: {
    suitColor: 0x4c1d95, // Plum Blazer
    shirtColor: 0xede9fe, // Lavender Top
    skinColor: 0xdfb496,
    hairColor: 0x3e1f13, // Warm Chestnut
    hairStyle: 'wavy',
    glasses: false,
    eyeColor: 0x3b2314,
    rimColor: 0xa855f7,
  },
  'polite-agreer': {
    suitColor: 0xbe123c, // Rosewood Blazer
    shirtColor: 0xffe4e6, // Rose Silk
    skinColor: 0xdfb496,
    hairColor: 0x4a2418,
    hairStyle: 'medium',
    glasses: false,
    eyeColor: 0x2b1d0c,
    rimColor: 0xf43f5e,
  },
  frustrated: {
    suitColor: 0x7f1d1d, // Wine Blazer
    shirtColor: 0xfef2f2,
    skinColor: 0xd49b78,
    hairColor: 0x1c1917,
    hairStyle: 'crop',
    glasses: false,
    eyeColor: 0x381e0d,
    rimColor: 0xf59e0b,
  },
  indifferent: {
    suitColor: 0x334155,
    shirtColor: 0xe2e8f0,
    skinColor: 0xbe8862,
    hairColor: 0x09090b,
    hairStyle: 'short',
    glasses: false,
    eyeColor: 0x262626,
    rimColor: 0x818cf8,
  },
  'numbers-focused': {
    suitColor: 0x0f172a,
    shirtColor: 0xf8fafc,
    tieColor: undefined,
    skinColor: 0xd9a583,
    hairColor: 0x1c1917,
    hairStyle: 'medium',
    glasses: true,
    eyeColor: 0x292524,
    rimColor: 0x4f7cff,
  },
  'skeptical-investor': {
    suitColor: 0x1e1b4b,
    shirtColor: 0xf5f3ff,
    skinColor: 0xdeb394,
    hairColor: 0x18181b,
    hairStyle: 'wavy',
    glasses: false,
    eyeColor: 0x312e81,
    rimColor: 0x7c4dff,
  },
  'product-focused': {
    suitColor: 0x064e3b,
    shirtColor: 0xecfdf5,
    skinColor: 0xdba88b,
    hairColor: 0x292524,
    hairStyle: 'wavy',
    glasses: false,
    eyeColor: 0x1c1917,
    rimColor: 0x00cba8,
  },
};

export const Human3DAvatar: React.FC<Human3DAvatarProps> = ({
  state,
  personaId = 'skeptic',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<AvatarState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 400;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090c12);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.12, 2.55);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const palette = PALETTES[personaId] || PALETTES['skeptic'];

    // 3. Studio Lighting Rig
    // Key Light (Warm soft studio key)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.85);
    keyLight.position.set(1.3, 1.8, 2.1);
    scene.add(keyLight);

    // Fill Light (Soft beauty fill)
    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.85);
    fillLight.position.set(-1.5, 0.7, 1.7);
    scene.add(fillLight);

    // Rim / Backlight (Hair and shoulder edge separation)
    const rimLight = new THREE.DirectionalLight(palette.rimColor, 1.7);
    rimLight.position.set(0, 1.9, -1.8);
    scene.add(rimLight);

    // Soft Ambient Light
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.65);
    scene.add(ambientLight);

    // 4. Avatar Human Body Hierarchical Assembly
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, -0.72, 0);
    scene.add(avatarGroup);

    // Soft Skin Material with subtle subsurface glow
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: palette.skinColor,
      roughness: 0.52,
      metalness: 0.04,
    });

    // Blazer Material
    const blazerMat = new THREE.MeshStandardMaterial({
      color: palette.suitColor,
      roughness: 0.7,
      metalness: 0.12,
    });

    // Inner Silk Blouse Material
    const blouseMat = new THREE.MeshStandardMaterial({
      color: palette.shirtColor,
      roughness: 0.45,
      metalness: 0.05,
    });

    // Hair Material with natural silkiness
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: palette.hairColor,
      roughness: 0.38,
      metalness: 0.18,
    });

    // Eye Cornea & Iris Material
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
    });
    const irisMaterial = new THREE.MeshStandardMaterial({
      color: palette.eyeColor,
      roughness: 0.12,
    });
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x020202 });

    // --- Feminine Torso & Tailored Blazer ---
    const torsoGeo = new THREE.CylinderGeometry(0.46, 0.58, 0.82, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, blazerMat);
    torsoMesh.position.set(0, 0.38, 0);
    avatarGroup.add(torsoMesh);

    // Inner Silk Blouse / Top (V-neck)
    const innerTopGeo = new THREE.ConeGeometry(0.24, 0.45, 16);
    const innerTop = new THREE.Mesh(innerTopGeo, blouseMat);
    innerTop.position.set(0, 0.52, 0.16);
    innerTop.rotation.x = Math.PI;
    avatarGroup.add(innerTop);

    // Blazer Lapels (Left & Right)
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.04), blazerMat);
    lapelL.position.set(-0.16, 0.52, 0.19);
    lapelL.rotation.set(-0.15, 0.25, -0.22);
    avatarGroup.add(lapelL);

    const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.04), blazerMat);
    lapelR.position.set(0.16, 0.52, 0.19);
    lapelR.rotation.set(-0.15, -0.25, 0.22);
    avatarGroup.add(lapelR);

    // Gold Pendant Necklace
    const necklaceMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const necklaceChain = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.005, 10, 24, Math.PI * 0.9), necklaceMat);
    necklaceChain.position.set(0, 0.64, 0.14);
    necklaceChain.rotation.x = Math.PI * 0.4;
    avatarGroup.add(necklaceChain);

    const necklacePendant = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), necklaceMat);
    necklacePendant.position.set(0, 0.52, 0.2);
    avatarGroup.add(necklacePendant);

    // Contoured Feminine Shoulders
    const shoulderLGeo = new THREE.SphereGeometry(0.21, 16, 16);
    const shoulderL = new THREE.Mesh(shoulderLGeo, blazerMat);
    shoulderL.position.set(-0.46, 0.66, 0);
    avatarGroup.add(shoulderL);

    const shoulderRGeo = new THREE.SphereGeometry(0.21, 16, 16);
    const shoulderR = new THREE.Mesh(shoulderRGeo, blazerMat);
    shoulderR.position.set(0.46, 0.66, 0);
    avatarGroup.add(shoulderR);

    // --- Neck & Head Articulation Group ---
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.88, 0);
    avatarGroup.add(headPivot);

    // Slender, graceful neck
    const neckGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.30, 20);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, 0.09, 0);
    headPivot.add(neckMesh);

    // Feminine Cranium & Head Contours
    const headGeo = new THREE.SphereGeometry(0.27, 28, 28);
    headGeo.scale(0.88, 1.12, 0.96);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.set(0, 0.32, 0.02);
    headPivot.add(headMesh);

    // Subtle Rosy Cheek Contours / Blush
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xeb8d8d, transparent: true, opacity: 0.28 });
    const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), blushMat);
    blushL.position.set(-0.13, 0.30, 0.23);
    blushL.rotation.y = -0.4;
    headPivot.add(blushL);

    const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), blushMat);
    blushR.position.set(0.13, 0.30, 0.23);
    blushR.rotation.y = 0.4;
    headPivot.add(blushR);

    // Ears (with pearl stud earrings)
    const earMat = skinMaterial;
    const earGeo = new THREE.SphereGeometry(0.055, 12, 12);
    earGeo.scale(0.35, 1.05, 0.75);
    const earL = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-0.25, 0.32, 0.02);
    earL.rotation.y = 0.2;
    headPivot.add(earL);

    const earR = new THREE.Mesh(earGeo, earMat);
    earR.position.set(0.25, 0.32, 0.02);
    earR.rotation.y = -0.2;
    headPivot.add(earR);

    // Pearl Stud Earrings
    const pearlMat = new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.15, metalness: 0.2 });
    const pearlL = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), pearlMat);
    pearlL.position.set(-0.26, 0.29, 0.04);
    headPivot.add(pearlL);

    const pearlR = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), pearlMat);
    pearlR.position.set(0.26, 0.29, 0.04);
    headPivot.add(pearlR);

    // --- Articulated Jaw (for speech mouth lip sync) ---
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, 0.23, 0.11);
    headPivot.add(jawPivot);

    const jawGeo = new THREE.SphereGeometry(0.12, 18, 18);
    jawGeo.scale(0.8, 0.55, 0.75);
    const jawMesh = new THREE.Mesh(jawGeo, skinMaterial);
    jawMesh.position.set(0, -0.05, 0.06);
    jawPivot.add(jawMesh);

    // Subtle Pearly Teeth
    const teethMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.016, 0.025), teethMat);
    teeth.position.set(0, 0.238, 0.245);
    headPivot.add(teeth);

    // Contoured Rosy Lips (Feminine smiling profile)
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xb84a5e, roughness: 0.32 });
    const upperLipGeo = new THREE.BoxGeometry(0.095, 0.022, 0.035);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    upperLip.position.set(0, 0.236, 0.255);
    headPivot.add(upperLip);

    const lowerLipGeo = new THREE.BoxGeometry(0.088, 0.022, 0.035);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
    lowerLip.position.set(0, -0.025, 0.135);
    jawPivot.add(lowerLip);

    // Refined Feminine Nose
    const noseGeo = new THREE.ConeGeometry(0.034, 0.10, 14);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, 0.30, 0.275);
    noseMesh.rotation.x = -0.22;
    headPivot.add(noseMesh);

    // --- Eyes Assembly (Left & Right) ---
    const eyeGroupL = new THREE.Group();
    eyeGroupL.position.set(-0.088, 0.34, 0.23);
    headPivot.add(eyeGroupL);

    const eyeGroupR = new THREE.Group();
    eyeGroupR.position.set(0.088, 0.34, 0.23);
    headPivot.add(eyeGroupR);

    // Eye spheres
    const eyeWhiteGeo = new THREE.SphereGeometry(0.035, 16, 16);
    const eyeWhiteL = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMaterial);
    eyeGroupL.add(eyeWhiteL);
    const eyeWhiteR = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMaterial);
    eyeGroupR.add(eyeWhiteR);

    // Irises (Warm hazel/dark expressive eyes)
    const irisGeo = new THREE.CircleGeometry(0.019, 16);
    const irisL = new THREE.Mesh(irisGeo, irisMaterial);
    irisL.position.set(0, 0, 0.034);
    eyeGroupL.add(irisL);

    const irisR = new THREE.Mesh(irisGeo, irisMaterial);
    irisR.position.set(0, 0, 0.034);
    eyeGroupR.add(irisR);

    // Pupils
    const pupilGeo = new THREE.CircleGeometry(0.009, 16);
    const pupilL = new THREE.Mesh(pupilGeo, pupilMaterial);
    pupilL.position.set(0, 0, 0.035);
    eyeGroupL.add(pupilL);

    const pupilR = new THREE.Mesh(pupilGeo, pupilMaterial);
    pupilR.position.set(0, 0, 0.035);
    eyeGroupR.add(pupilR);

    // Upper Eyelashes / Eyeliner accent
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x120c09 });
    const lashL = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.006, 0.015), lashMat);
    lashL.position.set(-0.088, 0.366, 0.245);
    lashL.rotation.z = -0.05;
    headPivot.add(lashL);

    const lashR = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.006, 0.015), lashMat);
    lashR.position.set(0.088, 0.366, 0.245);
    lashR.rotation.z = 0.05;
    headPivot.add(lashR);

    // Eyelids (for natural human blinking)
    const eyelidMat = skinMaterial.clone();
    const eyelidGeo = new THREE.SphereGeometry(0.038, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const eyelidL = new THREE.Mesh(eyelidGeo, eyelidMat);
    eyelidL.position.set(-0.088, 0.345, 0.23);
    eyelidL.rotation.x = -Math.PI * 0.5;
    eyelidL.scale.set(1, 0.05, 1);
    headPivot.add(eyelidL);

    const eyelidR = new THREE.Mesh(eyelidGeo, eyelidMat);
    eyelidR.position.set(0.088, 0.345, 0.23);
    eyelidR.rotation.x = -Math.PI * 0.5;
    eyelidR.scale.set(1, 0.05, 1);
    headPivot.add(eyelidR);

    // Delicate Arched Eyebrows
    const browMat = new THREE.MeshStandardMaterial({ color: palette.hairColor, roughness: 0.5 });
    const browGeo = new THREE.BoxGeometry(0.078, 0.014, 0.02);
    const browL = new THREE.Mesh(browGeo, browMat);
    browL.position.set(-0.088, 0.395, 0.25);
    browL.rotation.z = -0.08;
    headPivot.add(browL);

    const browR = new THREE.Mesh(browGeo, browMat);
    browR.position.set(0.088, 0.395, 0.25);
    browR.rotation.z = 0.08;
    headPivot.add(browR);

    // Glasses if equipped
    if (palette.glasses) {
      const glassFrameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
      const glassLensMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
        roughness: 0.1,
        transmission: 0.92,
      });

      const frameL = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.004, 12, 24), glassFrameMat);
      frameL.position.set(-0.088, 0.34, 0.275);
      headPivot.add(frameL);

      const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.040, 20), glassLensMat);
      lensL.position.set(-0.088, 0.34, 0.275);
      headPivot.add(lensL);

      const frameR = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.004, 12, 24), glassFrameMat);
      frameR.position.set(0.088, 0.34, 0.275);
      headPivot.add(frameR);

      const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.040, 20), glassLensMat);
      lensR.position.set(0.088, 0.34, 0.275);
      headPivot.add(lensR);

      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.05), glassFrameMat);
      bridge.position.set(0, 0.345, 0.278);
      bridge.rotation.z = Math.PI * 0.5;
      headPivot.add(bridge);
    }

    // --- 3D Flowing Shoulder-Length Layered Hair System ---
    const hairGroup = new THREE.Group();
    headPivot.add(hairGroup);

    // 1. Crown Volume
    const hairCrownGeo = new THREE.SphereGeometry(0.29, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairCrown = new THREE.Mesh(hairCrownGeo, hairMaterial);
    hairCrown.position.set(0, 0.35, -0.02);
    hairGroup.add(hairCrown);

    // 2. Top Side Sweep / Bangs
    const hairTopGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.10, 16);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMaterial);
    hairTop.position.set(-0.03, 0.56, 0.03);
    hairTop.rotation.z = -0.12;
    hairGroup.add(hairTop);

    // 3. Flowing Front Locks (Cascading over shoulders)
    const frontLockL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.52, 14), hairMaterial);
    frontLockL.position.set(-0.21, 0.12, 0.16);
    frontLockL.rotation.set(0.1, 0, 0.12);
    headPivot.add(frontLockL);

    const frontLockR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.52, 14), hairMaterial);
    frontLockR.position.set(0.21, 0.12, 0.16);
    frontLockR.rotation.set(0.1, 0, -0.12);
    headPivot.add(frontLockR);

    // 4. Back and Side Hair Volume
    const backHairGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.55, 18);
    const backHair = new THREE.Mesh(backHairGeo, hairMaterial);
    backHair.position.set(0, 0.12, -0.12);
    headPivot.add(backHair);

    // 5. Animation State Variables
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let nextBlinkTime = 2.5;
    let blinkDuration = 0.14;
    let isBlinking = false;
    let blinkProgress = 0;

    // 6. Realistic Render & Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const currentState = stateRef.current;

      // Natural Subtle Breathing (Torso & Shoulders)
      avatarGroup.position.y = -0.72 + Math.sin(elapsed * 1.6) * 0.008;

      // --- Natural Eye Blinking Logic ---
      if (!isBlinking && elapsed > nextBlinkTime) {
        isBlinking = true;
        blinkProgress = 0;
        nextBlinkTime = elapsed + 3.0 + Math.random() * 3.5;
      }

      if (isBlinking) {
        blinkProgress += delta / blinkDuration;
        if (blinkProgress >= 1.0) {
          isBlinking = false;
          eyelidL.scale.y = 0.05;
          eyelidR.scale.y = 0.05;
        } else {
          // Parabolic blink closing and opening
          const blinkScale = Math.sin(blinkProgress * Math.PI) * 1.95 + 0.05;
          eyelidL.scale.y = blinkScale;
          eyelidR.scale.y = blinkScale;
        }
      }

      // --- State-Driven Head & Eye Articulation ---
      if (currentState === 'speaking') {
        // Natural speech cadence head motion
        headPivot.rotation.x = Math.sin(elapsed * 4.5) * 0.03 + Math.cos(elapsed * 2.2) * 0.015;
        headPivot.rotation.y = Math.sin(elapsed * 2.8) * 0.035;
        headPivot.rotation.z = Math.cos(elapsed * 3.1) * 0.015;

        // Dynamic multi-vowel mouth lip-sync opening driven by speech frequencies
        const speechCadence =
          Math.abs(Math.sin(elapsed * 9.5)) * 0.5 +
          Math.abs(Math.cos(elapsed * 14.2)) * 0.35 +
          Math.abs(Math.sin(elapsed * 18.0)) * 0.15;

        jawPivot.rotation.x = speechCadence * 0.22;
        jawPivot.position.y = 0.23 - speechCadence * 0.025;

        // Eyebrow micro-emphasis while talking
        browL.position.y = 0.395 + Math.sin(elapsed * 4.0) * 0.006;
        browR.position.y = 0.395 + Math.sin(elapsed * 4.0) * 0.006;
      } else if (currentState === 'listening') {
        // Attentive listening posture: head tilts slightly, locked eye contact
        headPivot.rotation.x = -0.03 + Math.sin(elapsed * 1.8) * 0.01;
        headPivot.rotation.y = 0.02 + Math.sin(elapsed * 1.2) * 0.01;
        headPivot.rotation.z = 0.03; // Gentle attentive tilt

        // Mouth closed at rest
        jawPivot.rotation.x = 0;
        jawPivot.position.y = 0.23;

        // Receptive brow posture
        browL.position.y = 0.398;
        browR.position.y = 0.398;
      } else if (currentState === 'thinking') {
        // Contemplative gaze shift upward & slightly to side
        headPivot.rotation.x = 0.06 + Math.sin(elapsed * 1.5) * 0.01;
        headPivot.rotation.y = -0.07 + Math.cos(elapsed * 1.2) * 0.01;
        headPivot.rotation.z = -0.02;

        // Mouth closed
        jawPivot.rotation.x = 0;
        jawPivot.position.y = 0.23;

        // Thoughtful furrowed brow
        browL.position.y = 0.390;
        browR.position.y = 0.392;
      } else {
        // Neutral / Ready posture
        headPivot.rotation.x = Math.sin(elapsed * 1.2) * 0.012;
        headPivot.rotation.y = Math.cos(elapsed * 1.0) * 0.015;
        headPivot.rotation.z = 0;

        jawPivot.rotation.x = 0;
        jawPivot.position.y = 0.23;

        browL.position.y = 0.395;
        browR.position.y = 0.395;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      scene.clear();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [personaId]);

  return <div ref={mountRef} className="human-3d-canvas-mount" />;
};
