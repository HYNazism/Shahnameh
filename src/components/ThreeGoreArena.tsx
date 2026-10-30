import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  clampDt,
  computePlayerAttackDamage,
  computePlayerDamageReceived,
  computeSadehFlintCounter,
  EnemyArchetype,
  evaluateEnemyPolicy,
  PlayerRunState,
  resolveDivBandFinisher,
} from '../game/rules';
import { GameSettings } from '../data/i18nAndSettings';
import { soundEngine } from '../game/soundEngine';
import { LiveCombatTelemetry } from './GameCanvas';

interface ThreeGoreArenaProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  isModalOpen: boolean;
  runState: PlayerRunState;
  settings: GameSettings;
  onSyncRunState: (updater: (prev: PlayerRunState) => PlayerRunState) => void;
  onSyncTelemetry: (telemetry: LiveCombatTelemetry) => void;
  onEpochWaveCleared: () => void;
  onPlayerDefeated: () => void;
  onTriggerPause: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onQuickRestart: () => void;
}

interface Enemy3DEntity {
  id: number;
  archetype: EnemyArchetype;
  name: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  hp: number;
  maxHp: number;
  posture: number;
  maxPosture: number;
  radius: number;
  speed: number;
  damage: number;
  state: 'seeking' | 'telegraph' | 'attacking' | 'recovering' | 'bound' | 'ko';
  stateTimer: number;
  telegraphDuration: number;
  attackCooldown: number;
  hitFlashTimer: number;
  phaseOffset: number;
  walkCycle: number;
  group: THREE.Group;
  headGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  weaponArmGroup: THREE.Group;
  hpBarMesh: THREE.Mesh;
  postureRingMesh: THREE.Mesh;
}

interface SeveredGib3D {
  mesh: THREE.Object3D;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  life: number;
  bounces: number;
}

interface ArterialDrop3D {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  baseScale: number;
}

interface BloodPoolDecal3D {
  mesh: THREE.Mesh;
  scale: number;
  targetScale: number;
}

interface Projectile3D {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  damage: number;
  life: number;
  reflectedByPlayer: boolean;
}

// Pre-allocated module-scope scratch objects (Zero GC in render loop)
const _dummyObj = new THREE.Object3D();
const _colorScratch = new THREE.Color();
const _lookTarget = new THREE.Vector3();

export const ThreeGoreArena: React.FC<ThreeGoreArenaProps> = ({
  gameState,
  isModalOpen,
  runState,
  settings,
  onSyncRunState,
  onSyncTelemetry,
  onEpochWaveCleared,
  onPlayerDefeated,
  onTriggerPause,
  onToggleMute,
  onOpenSettings,
  onQuickRestart,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Refs for latest props inside stable WebGL loop
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isModalOpenRef = useRef(isModalOpen);
  isModalOpenRef.current = isModalOpen;
  const runStateRef = useRef(runState);
  runStateRef.current = runState;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const callbacksRef = useRef({
    onSyncRunState,
    onSyncTelemetry,
    onEpochWaveCleared,
    onPlayerDefeated,
    onTriggerPause,
    onToggleMute,
    onOpenSettings,
    onQuickRestart,
  });
  callbacksRef.current = {
    onSyncRunState,
    onSyncTelemetry,
    onEpochWaveCleared,
    onPlayerDefeated,
    onTriggerPause,
    onToggleMute,
    onOpenSettings,
    onQuickRestart,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software-WebGL Detection
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(0x0b0706);
    scene.background = fogColor;
    scene.fog = new THREE.FogExp2(0x0b0706, 0.018);

    // 2. Studio PBR Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.5, 160);
    camera.position.set(0, 11.8, 13.2);
    camera.lookAt(0, 1.0, 0);

    // 3. Balanced 3-Point Studio & Fire Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x2a0a08, 0.9);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe4b5, 2.5);
    keyLight.position.set(14, 26, 16);
    keyLight.castShadow = !isSoftwareGl;
    const d = 24;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 65;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdc2626, 1.35);
    rimLight.position.set(-16, 14, -14);
    scene.add(rimLight);

    // 4. Procedural Persian Miniature & Carved Stone Floor Texture
    const createArenaFloorTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#150F0D';
      ctx.fillRect(0, 0, 512, 512);

      // Lapis & Gold Persian geometric tiles
      ctx.strokeStyle = '#3E2716';
      ctx.lineWidth = 2.5;
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }

      // Central Shamseh Medallion
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(256, 256, 140, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(256, 256, 95, 0, Math.PI * 2);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };

    const floorGeo = new THREE.PlaneGeometry(42, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createArenaFloorTexture(),
      roughness: 0.68,
      metalness: 0.18,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // 5. Natural Outdoor Alborz / Damavand Mountain Crags Perimeter
    const cragCount = 36;
    const cragGeo = new THREE.ConeGeometry(1.6, 6.5, 6);
    cragGeo.translate(0, 3.25, 0);
    const cragMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.85,
      metalness: 0.15,
    });
    const cragInstanced = new THREE.InstancedMesh(cragGeo, cragMat, cragCount);
    for (let i = 0; i < cragCount; i++) {
      const t = i / Math.max(1, cragCount - 1);
      const angle = Math.PI * 0.88 + t * Math.PI * 1.24;
      const rx = Math.cos(angle) * 21.0 + Math.sin(i * 7) * 0.9;
      const rz = Math.sin(angle) * 14.5 + Math.cos(i * 5) * 0.8;
      _dummyObj.position.set(rx, -0.2, rz);
      _dummyObj.rotation.set(0, i * 0.8, 0);
      const s = 0.82 + (i % 4) * 0.2;
      _dummyObj.scale.set(s, s * (0.9 + (i % 3) * 0.22), s);
      _dummyObj.updateMatrix();
      cragInstanced.setMatrixAt(i, _dummyObj.matrix);
      _colorScratch.setHex(i % 3 === 0 ? 0x291d18 : i % 2 === 0 ? 0x172554 : 0x1c1917);
      cragInstanced.setColorAt(i, _colorScratch);
    }
    cragInstanced.instanceMatrix.needsUpdate = true;
    if (cragInstanced.instanceColor) cragInstanced.instanceColor.needsUpdate = true;
    cragInstanced.computeBoundingSphere();
    scene.add(cragInstanced);

    // Shared Contact Shadow Geometry & Material
    const contactShadowGeo = new THREE.CircleGeometry(0.85, 20);
    contactShadowGeo.rotateX(-Math.PI / 2);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    // =========================================================================
    // 6. ANATOMICALLY PROPORTIONATE, ARTICULATED PERSIAN PAHLAVAN / SHAH 3D RIG
    // =========================================================================
    const buildPersianHeroGroup = (): {
      root: THREE.Group;
      leftLegGroup: THREE.Group;
      rightLegGroup: THREE.Group;
      leftArmGroup: THREE.Group;
      weaponPivot: THREE.Group;
      capeMesh: THREE.Mesh;
      haloMesh: THREE.Mesh;
    } => {
      const root = new THREE.Group();

      // Materials
      const bronzeMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.3,
        metalness: 0.82,
      });
      const goldMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        roughness: 0.2,
        metalness: 0.92,
        clearcoat: 0.5,
      });
      const lapisArmorMat = new THREE.MeshPhysicalMaterial({
        color: 0x1e3a8a,
        roughness: 0.32,
        metalness: 0.62,
        clearcoat: 0.55,
      });
      const crimsonClothMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.65,
        metalness: 0.1,
      });
      const darkLeatherMat = new THREE.MeshStandardMaterial({
        color: 0x291d18,
        roughness: 0.72,
        metalness: 0.15,
      });
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xeab68c,
        roughness: 0.55,
        metalness: 0.05,
      });
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.22,
        metalness: 0.92,
      });

      // Contact Shadow
      const shadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
      shadow.position.y = 0.02;
      root.add(shadow);

      // Helper to build an articulated leg (hip -> thigh -> knee guard -> shin greave -> boot)
      const createLegRig = (offsetX: number) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(offsetX, 0.92, 0);

        const thighGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.44, 10);
        thighGeo.translate(0, -0.22, 0);
        const thigh = new THREE.Mesh(thighGeo, darkLeatherMat);
        legGroup.add(thigh);

        const kneeGeo = new THREE.SphereGeometry(0.135, 10, 8);
        const knee = new THREE.Mesh(kneeGeo, goldMat);
        knee.position.set(0, -0.44, 0.03);
        legGroup.add(knee);

        const shinGeo = new THREE.CylinderGeometry(0.13, 0.105, 0.42, 10);
        shinGeo.translate(0, -0.65, 0);
        const shin = new THREE.Mesh(shinGeo, bronzeMat);
        legGroup.add(shin);

        const bootGeo = new THREE.BoxGeometry(0.22, 0.14, 0.34);
        const boot = new THREE.Mesh(bootGeo, darkLeatherMat);
        boot.position.set(0, -0.85, 0.05);
        legGroup.add(boot);

        return legGroup;
      };

      const leftLegGroup = createLegRig(-0.21);
      const rightLegGroup = createLegRig(0.21);
      root.add(leftLegGroup, rightLegGroup);

      // Armored Pelvis & Persian Royal Kamarband (Waist Belt + Tassets)
      const pelvisGeo = new THREE.CylinderGeometry(0.34, 0.31, 0.28, 12);
      const pelvis = new THREE.Mesh(pelvisGeo, crimsonClothMat);
      pelvis.position.set(0, 0.98, 0);
      root.add(pelvis);

      const beltGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 14);
      const belt = new THREE.Mesh(beltGeo, goldMat);
      belt.position.set(0, 1.08, 0);
      root.add(belt);

      // V-Tapered Heroic Cuirass Torso (Jawshan-e Kiani / Babr-e Bayan)
      const torsoGeo = new THREE.CylinderGeometry(0.46, 0.33, 0.78, 12);
      const torso = new THREE.Mesh(torsoGeo, lapisArmorMat);
      torso.scale.set(1.08, 1.0, 0.76);
      torso.position.set(0, 1.5, 0);
      torso.castShadow = !isSoftwareGl;
      root.add(torso);

      // Golden Shamseh Chest Medallion
      const chestPlateGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12);
      chestPlateGeo.rotateX(Math.PI / 2);
      const chestPlate = new THREE.Mesh(chestPlateGeo, goldMat);
      chestPlate.position.set(0, 1.58, 0.34);
      root.add(chestPlate);

      // Flowing Royal Crimson Cape on Back
      const capeGeo = new THREE.PlaneGeometry(0.86, 1.45, 4, 6);
      capeGeo.translate(0, -0.72, 0);
      const capeMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.7,
        side: THREE.DoubleSide,
      });
      const capeMesh = new THREE.Mesh(capeGeo, capeMat);
      capeMesh.position.set(0, 1.84, -0.32);
      capeMesh.rotation.x = 0.18;
      root.add(capeMesh);

      // Articulated Left Arm + Persian Sepah Round Shield
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.54, 1.78, 0);

      const pauldronGeo = new THREE.SphereGeometry(0.2, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
      const leftPauldron = new THREE.Mesh(pauldronGeo, goldMat);
      leftPauldron.position.set(0, 0.04, 0);
      leftArmGroup.add(leftPauldron);

      const upperArmGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.38, 10);
      upperArmGeo.translate(0, -0.19, 0);
      const leftUpperArm = new THREE.Mesh(upperArmGeo, crimsonClothMat);
      leftArmGroup.add(leftUpperArm);

      const forearmGeo = new THREE.CylinderGeometry(0.1, 0.085, 0.36, 10);
      forearmGeo.translate(0, -0.18, 0);
      const leftForearm = new THREE.Mesh(forearmGeo, bronzeMat);
      leftForearm.position.set(0, -0.36, 0.06);
      leftForearm.rotation.x = -0.55;
      leftArmGroup.add(leftForearm);

      // Authentic Round Persian Sepah Shield mounted on left forearm
      const shieldGroup = new THREE.Group();
      shieldGroup.position.set(-0.08, -0.45, 0.28);
      shieldGroup.rotation.y = -0.35;
      shieldGroup.rotation.x = -0.15;

      const shieldDiskGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.05, 20);
      shieldDiskGeo.rotateX(Math.PI / 2);
      const shieldDiskMat = new THREE.MeshPhysicalMaterial({
        color: 0x7f1d1d,
        roughness: 0.28,
        metalness: 0.72,
        clearcoat: 0.6,
      });
      const shieldDisk = new THREE.Mesh(shieldDiskGeo, shieldDiskMat);
      shieldGroup.add(shieldDisk);

      const shieldRimGeo = new THREE.TorusGeometry(0.42, 0.03, 8, 24);
      const shieldRim = new THREE.Mesh(shieldRimGeo, goldMat);
      shieldGroup.add(shieldRim);

      const shieldBossGeo = new THREE.SphereGeometry(0.11, 10, 8);
      const shieldBoss = new THREE.Mesh(shieldBossGeo, goldMat);
      shieldBoss.position.set(0, 0, 0.03);
      shieldGroup.add(shieldBoss);

      leftArmGroup.add(shieldGroup);
      root.add(leftArmGroup);

      // Articulated Right Arm + Gorz-e Gavsar (Bull-Headed Royal Mace)
      const weaponPivot = new THREE.Group();
      weaponPivot.position.set(0.54, 1.78, 0);

      const rightPauldron = new THREE.Mesh(pauldronGeo, goldMat);
      rightPauldron.position.set(0, 0.04, 0);
      weaponPivot.add(rightPauldron);

      const rightUpperArm = new THREE.Mesh(upperArmGeo, crimsonClothMat);
      weaponPivot.add(rightUpperArm);

      const rightForearmGroup = new THREE.Group();
      rightForearmGroup.position.set(0, -0.36, 0);
      rightForearmGroup.rotation.x = -0.65;

      const rightForearm = new THREE.Mesh(forearmGeo, bronzeMat);
      rightForearmGroup.add(rightForearm);

      const handGeo = new THREE.SphereGeometry(0.095, 8, 8);
      const rightHand = new THREE.Mesh(handGeo, skinMat);
      rightHand.position.set(0, -0.36, 0);
      rightForearmGroup.add(rightHand);

      // Gorz-e Gavsar (Bull-Headed Mace) held in right hand
      const maceGroup = new THREE.Group();
      maceGroup.position.set(0, -0.36, 0.05);
      maceGroup.rotation.x = Math.PI * 0.46;

      const shaftGeo = new THREE.CylinderGeometry(0.038, 0.046, 1.55, 10);
      shaftGeo.translate(0, 0.62, 0);
      const shaft = new THREE.Mesh(shaftGeo, steelMat);
      maceGroup.add(shaft);

      // Flanged Bull-Head Mace Crown
      const maceHeadGeo = new THREE.DodecahedronGeometry(0.21, 0);
      const maceHead = new THREE.Mesh(maceHeadGeo, goldMat);
      maceHead.position.set(0, 1.38, 0);
      maceGroup.add(maceHead);

      // Twin Bull Horns on Gorz-e Gavsar
      const bullHornGeo = new THREE.ConeGeometry(0.055, 0.28, 8);
      const leftBullHorn = new THREE.Mesh(bullHornGeo, steelMat);
      leftBullHorn.position.set(-0.18, 1.48, 0.04);
      leftBullHorn.rotation.z = 0.7;
      const rightBullHorn = new THREE.Mesh(bullHornGeo, steelMat);
      rightBullHorn.position.set(0.18, 1.48, 0.04);
      rightBullHorn.rotation.z = -0.7;
      maceGroup.add(leftBullHorn, rightBullHorn);

      rightForearmGroup.add(maceGroup);
      weaponPivot.add(rightForearmGroup);
      root.add(weaponPivot);

      // Proportionate Neck, Head, Persian Royal Beard, Mustache & Kayanian Crown
      const neckGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.16, 10);
      const neck = new THREE.Mesh(neckGeo, skinMat);
      neck.position.set(0, 1.94, 0);
      root.add(neck);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.15, 0);

      const headGeo = new THREE.SphereGeometry(0.22, 16, 14);
      const head = new THREE.Mesh(headGeo, skinMat);
      head.scale.set(0.95, 1.08, 0.98);
      headGroup.add(head);

      // Eyes & Dark Brows
      const eyeGeo = new THREE.SphereGeometry(0.028, 6, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.075, 0.03, 0.195);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.075, 0.03, 0.195);
      headGroup.add(leftEye, rightEye);

      // Sculpted Persian Royal Beard & Mustache
      const beardMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.82,
      });
      const jawBeardGeo = new THREE.ConeGeometry(0.18, 0.34, 10);
      const jawBeard = new THREE.Mesh(jawBeardGeo, beardMat);
      jawBeard.rotation.x = Math.PI;
      jawBeard.position.set(0, -0.14, 0.09);
      headGroup.add(jawBeard);

      // Spired Kayanian Helmet-Crown (Kolah-Khod & Taj)
      const crownRimGeo = new THREE.CylinderGeometry(0.235, 0.22, 0.18, 14);
      const crownRim = new THREE.Mesh(crownRimGeo, goldMat);
      crownRim.position.set(0, 0.17, 0);
      headGroup.add(crownRim);

      const helmDomeGeo = new THREE.SphereGeometry(0.215, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const helmDome = new THREE.Mesh(helmDomeGeo, lapisArmorMat);
      helmDome.position.set(0, 0.18, 0);
      headGroup.add(helmDome);

      const spireGeo = new THREE.ConeGeometry(0.04, 0.22, 8);
      const spire = new THREE.Mesh(spireGeo, goldMat);
      spire.position.set(0, 0.44, 0);
      headGroup.add(spire);

      root.add(headGroup);

      // Subtle Halo of Royal Farr behind shoulders
      const haloGeo = new THREE.TorusGeometry(0.58, 0.028, 8, 28);
      const haloMat = new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        emissive: 0xd97706,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.9,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(0, 1.75, -0.28);
      root.add(haloMesh);

      return {
        root,
        leftLegGroup,
        rightLegGroup,
        leftArmGroup,
        weaponPivot,
        capeMesh,
        haloMesh,
      };
    };

    const heroModel = buildPersianHeroGroup();
    scene.add(heroModel.root);

    // 7. 4 Corner Sadeh Fire Braziers
    const brazierCoords = [
      { x: -15.5, z: -10.2 },
      { x: 15.5, z: -10.2 },
      { x: -15.5, z: 10.2 },
      { x: 15.5, z: 10.2 },
    ];
    const braziers3D: Array<{
      x: number;
      z: number;
      ignited: boolean;
      flameMesh: THREE.Mesh;
      light: THREE.PointLight;
    }> = [];

    const pedestalGeo = new THREE.CylinderGeometry(0.85, 1.15, 1.3, 10);
    pedestalGeo.translate(0, 0.65, 0);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.8,
      metalness: 0.2,
    });
    const flameGeo = new THREE.ConeGeometry(0.65, 1.7, 10);
    flameGeo.translate(0, 1.85, 0);

    brazierCoords.forEach((coord) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(coord.x, 0, coord.z);
      const ped = new THREE.Mesh(pedestalGeo, pedestalMat);
      bGroup.add(ped);

      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.0,
      });
      const flameMesh = new THREE.Mesh(flameGeo, flameMat);
      bGroup.add(flameMesh);

      const light = new THREE.PointLight(0xf97316, 0, 14, 2);
      light.position.set(0, 2.5, 0);
      bGroup.add(light);

      scene.add(bGroup);
      braziers3D.push({
        x: coord.x,
        z: coord.z,
        ignited: false,
        flameMesh,
        light,
      });
    });

    // =========================================================================
    // 8. ANATOMICALLY PROPORTIONATE, ARTICULATED DIV & TYRANT ENEMY 3D RIG
    // =========================================================================
    const buildDivEnemyGroup = (
      archetype: EnemyArchetype,
      isBoss: boolean,
      epochIdx: number
    ) => {
      const group = new THREE.Group();
      const scale = isBoss ? 1.32 : archetype === 'poulad_charger' ? 1.12 : 0.96;

      // Contact Shadow
      const shadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
      shadow.scale.setScalar(scale);
      shadow.position.y = 0.02;
      group.add(shadow);

      // Epoch-specific Boss Visual Theme (Div-e Siah, Zahhak, Div-e Sepid, Afrasiab, Esfandiyar Ruin-Tan, Shaghad, Finale)
      const isDivSepid = isBoss && epochIdx === 6;
      const isZahhak = isBoss && (epochIdx === 4 || epochIdx === 5);
      const isEsfandiyar = isBoss && epochIdx === 9;
      const isAfrasiabOrShaghad = isBoss && (epochIdx === 7 || epochIdx === 8 || epochIdx === 10);

      const skinColor = isDivSepid
        ? 0xe2e8f0 // Snow-White Demon of Mazandaran
        : isEsfandiyar
        ? 0xd97706 // Brazen-Bodied (Ruin-Tan) Gleaming Bronze-Gold Invulnerable Skin/Plate
        : isZahhak
        ? 0x3f2e21 // Tyrant Biwarasp Zahhak
        : isAfrasiabOrShaghad
        ? 0x7f1d1d // Turanian / Kabul Warlord Crimson Mail
        : archetype === 'div_siah_boss'
        ? 0x18181b // Pitch-black Div-e Siah
        : archetype === 'poulad_charger'
        ? 0x7f1d1d // Iron-blood Poulad Div
        : archetype === 'jadu_kiter'
        ? 0x4c1d95 // Violet-robed Jadu Sorcerer
        : 0x451a14; // Gurg-Div Beastman

      const armorColor = isDivSepid
        ? 0x475569
        : isEsfandiyar
        ? 0xf59e0b
        : isZahhak
        ? 0x991b1b
        : archetype === 'jadu_kiter'
        ? 0x3b0764
        : 0x27272a;

      const skinMat = new THREE.MeshPhysicalMaterial({
        color: skinColor,
        roughness: 0.45,
        metalness: 0.25,
        clearcoat: 0.35,
      });
      const armorMat = new THREE.MeshStandardMaterial({
        color: armorColor,
        roughness: 0.4,
        metalness: 0.75,
      });
      const hornMat = new THREE.MeshStandardMaterial({
        color: isDivSepid ? 0x94a3b8 : 0xd97706,
        roughness: 0.3,
        metalness: 0.8,
      });

      // Articulated Bipedal Demon Legs
      const createDemonLeg = (offsetX: number) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(offsetX * scale, 0.88 * scale, 0);

        const thighGeo = new THREE.CylinderGeometry(0.16 * scale, 0.13 * scale, 0.44 * scale, 9);
        thighGeo.translate(0, -0.22 * scale, 0);
        const thigh = new THREE.Mesh(thighGeo, skinMat);
        legGroup.add(thigh);

        const shinGeo = new THREE.CylinderGeometry(0.13 * scale, 0.095 * scale, 0.44 * scale, 9);
        shinGeo.translate(0, -0.64 * scale, 0);
        const shin = new THREE.Mesh(shinGeo, armorMat);
        legGroup.add(shin);

        const hoofGeo = new THREE.BoxGeometry(0.22 * scale, 0.13 * scale, 0.32 * scale);
        const hoof = new THREE.Mesh(hoofGeo, armorMat);
        hoof.position.set(0, -0.84 * scale, 0.04 * scale);
        legGroup.add(hoof);

        return legGroup;
      };

      const leftLegGroup = createDemonLeg(-0.22);
      const rightLegGroup = createDemonLeg(0.22);
      group.add(leftLegGroup, rightLegGroup);

      // Armored Waist / Loincloth
      const pelvisGeo = new THREE.CylinderGeometry(0.35 * scale, 0.32 * scale, 0.28 * scale, 10);
      const pelvis = new THREE.Mesh(pelvisGeo, armorMat);
      pelvis.position.set(0, 0.94 * scale, 0);
      group.add(pelvis);

      // Muscular V-Tapered Demon Torso
      const torsoGeo = new THREE.CylinderGeometry(0.48 * scale, 0.33 * scale, 0.82 * scale, 10);
      const torso = new THREE.Mesh(torsoGeo, skinMat);
      torso.scale.set(1.12, 1.0, 0.8);
      torso.position.set(0, 1.45 * scale, 0);
      torso.castShadow = !isSoftwareGl;
      group.add(torso);

      // If Zahhak Boss: Twin Black Serpents rising from shoulders!
      if (isZahhak) {
        const serpentMat = new THREE.MeshStandardMaterial({
          color: 0x09090b,
          roughness: 0.25,
          metalness: 0.6,
        });
        [-1, 1].forEach((side) => {
          const sCurve = new THREE.TorusGeometry(0.22 * scale, 0.055 * scale, 8, 14, Math.PI * 1.15);
          const sMesh = new THREE.Mesh(sCurve, serpentMat);
          sMesh.position.set(side * 0.48 * scale, 1.98 * scale, 0.08 * scale);
          sMesh.rotation.y = side * 0.4;
          group.add(sMesh);
        });
      }

      // Exposed Crimson Neck Stump (revealed only after decapitation)
      const neckGoreGeo = new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 0.14 * scale, 10);
      const neckGoreMat = new THREE.MeshBasicMaterial({ color: 0x881313 });
      const neckGoreMesh = new THREE.Mesh(neckGoreGeo, neckGoreMat);
      neckGoreMesh.position.set(0, 1.9 * scale, 0);
      group.add(neckGoreMesh);

      // Proportionate Detachable Demon Head + Sculpted Brow + Jaw + Curved Horns
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.08 * scale, 0);

      const skullGeo = new THREE.SphereGeometry(0.23 * scale, 12, 12);
      const skull = new THREE.Mesh(skullGeo, skinMat);
      skull.scale.set(0.96, 1.08, 1.02);
      headGroup.add(skull);

      // Lower Fang Jaw
      const jawGeo = new THREE.BoxGeometry(0.24 * scale, 0.14 * scale, 0.24 * scale);
      const jaw = new THREE.Mesh(jawGeo, skinMat);
      jaw.position.set(0, -0.14 * scale, 0.06 * scale);
      headGroup.add(jaw);

      // Curved Ram/Demon Horns (2 segments per horn for natural curve)
      [-1, 1].forEach((side) => {
        const hornBaseGeo = new THREE.ConeGeometry(0.065 * scale, 0.34 * scale, 8);
        const hornBase = new THREE.Mesh(hornBaseGeo, hornMat);
        hornBase.position.set(side * 0.19 * scale, 0.2 * scale, -0.02 * scale);
        hornBase.rotation.z = -side * 0.55;
        hornBase.rotation.x = 0.25;
        headGroup.add(hornBase);
      });

      // Glowing Eyes
      const eyeGeo = new THREE.SphereGeometry(0.036 * scale, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({
        color: isDivSepid ? 0x38bdf8 : 0xef4444,
      });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.085 * scale, 0.04 * scale, 0.21 * scale);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.085 * scale, 0.04 * scale, 0.21 * scale);
      headGroup.add(leftEye, rightEye);

      group.add(headGroup);

      // Articulated Left Claw/Buckler Arm
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.55 * scale, 1.72 * scale, 0);

      const armGeo = new THREE.CylinderGeometry(0.12 * scale, 0.095 * scale, 0.62 * scale, 9);
      armGeo.translate(0, -0.31 * scale, 0);
      const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
      leftArmMesh.rotation.x = -0.35;
      leftArmGroup.add(leftArmMesh);
      group.add(leftArmGroup);

      // Articulated Right Weapon Arm + Spiked Iron War-Club / Cleaver
      const weaponArmGroup = new THREE.Group();
      weaponArmGroup.position.set(0.55 * scale, 1.72 * scale, 0);

      const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
      rightArmMesh.rotation.x = -0.5;
      weaponArmGroup.add(rightArmMesh);

      const handleGeo = new THREE.CylinderGeometry(0.04 * scale, 0.05 * scale, 1.15 * scale, 8);
      handleGeo.rotateX(Math.PI / 2);
      const clubMat = new THREE.MeshStandardMaterial({
        color: isDivSepid ? 0x64748b : 0x7f1d1d,
        roughness: 0.35,
        metalness: 0.82,
      });
      const clubShaft = new THREE.Mesh(handleGeo, clubMat);
      clubShaft.position.set(0, -0.45 * scale, 0.45 * scale);
      weaponArmGroup.add(clubShaft);

      const clubHeadGeo = new THREE.DodecahedronGeometry(0.19 * scale, 0);
      const clubHead = new THREE.Mesh(clubHeadGeo, armorMat);
      clubHead.position.set(0, -0.45 * scale, 0.98 * scale);
      weaponArmGroup.add(clubHead);

      group.add(weaponArmGroup);

      // Overhead HP Bar & Ground Posture Ring
      const hpBarGeo = new THREE.PlaneGeometry(1.15 * scale, 0.12);
      const hpBarMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
      });
      const hpBarMesh = new THREE.Mesh(hpBarGeo, hpBarMat);
      hpBarMesh.position.set(0, 2.65 * scale, 0);
      group.add(hpBarMesh);

      const postureRingGeo = new THREE.RingGeometry(0.68 * scale, 0.82 * scale, 24);
      postureRingGeo.rotateX(-Math.PI / 2);
      const postureRingMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.32,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const postureRingMesh = new THREE.Mesh(postureRingGeo, postureRingMat);
      postureRingMesh.position.y = 0.03;
      group.add(postureRingMesh);

      return {
        group,
        headGroup,
        leftLegGroup,
        rightLegGroup,
        leftArmGroup,
        weaponArmGroup,
        hpBarMesh,
        postureRingMesh,
      };
    };

    // =========================================================================
    // 9. LOGICAL, DIRECTIONAL ARTERIAL BLOOD PHYSICS & FLOOR SPLATTER DECALS
    // =========================================================================
    const arterialDrops: ArterialDrop3D[] = [];
    const severedGibs: SeveredGib3D[] = [];
    const bloodPools: BloodPoolDecal3D[] = [];
    const projectiles: Projectile3D[] = [];
    const enemies: Enemy3DEntity[] = [];

    // Fine, anatomically scaled droplet geometry (radius 0.028m, stretched along velocity vector)
    const dropGeo = new THREE.SphereGeometry(0.028, 6, 6);
    const bloodPoolGeo = new THREE.PlaneGeometry(1.35, 1.35);
    bloodPoolGeo.rotateX(-Math.PI / 2);

    const createBloodSplatterTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 256);

      // Coagulated dark arterial center with organic irregular edges
      const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 92);
      grad.addColorStop(0, 'rgba(38, 4, 4, 0.92)');
      grad.addColorStop(0.5, 'rgba(98, 11, 11, 0.84)');
      grad.addColorStop(0.8, 'rgba(136, 19, 19, 0.45)');
      grad.addColorStop(1, 'rgba(127, 29, 29, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(128, 128, 92, 0, Math.PI * 2);
      ctx.fill();

      // Directional arterial streaks & fine satellite droplets
      for (let i = 0; i < 18; i++) {
        const ang = (i / 18) * Math.PI * 2 + (i % 3) * 0.22;
        const dist = 54 + (i % 5) * 11;
        const r = 2.2 + (i % 4) * 1.8;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(78, 8, 8, 0.85)' : 'rgba(125, 18, 18, 0.75)';
        ctx.beginPath();
        ctx.ellipse(
          128 + Math.cos(ang) * dist,
          128 + Math.sin(ang) * dist,
          r * 1.6,
          r * 0.8,
          ang,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const bloodSplatterTex = createBloodSplatterTexture();
    const bloodPoolMat = new THREE.MeshBasicMaterial({
      map: bloodSplatterTex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const spawnBloodPool = (x: number, z: number, radius: number, angle = 0) => {
      if (settingsRef.current.goreIntensityMultiplier <= 0.05) return;
      if (bloodPools.length > 42) {
        const oldest = bloodPools.shift();
        if (oldest) scene.remove(oldest.mesh);
      }
      const mesh = new THREE.Mesh(bloodPoolGeo, bloodPoolMat);
      mesh.position.set(x, 0.02 + bloodPools.length * 0.0003, z);
      mesh.rotation.y = angle || Math.random() * Math.PI * 2;
      mesh.scale.setScalar(0.08);
      scene.add(mesh);

      // Keep floor splatters anatomically proportionate (0.32m - 0.95m)
      const clampedScale = Math.min(
        1.15,
        radius * Math.min(1.25, Math.max(0.55, settingsRef.current.goreIntensityMultiplier * 0.65))
      );
      bloodPools.push({
        mesh,
        scale: 0.08,
        targetScale: clampedScale,
      });
    };

    /**
     * Spawns a directional cone of fine, velocity-aligned arterial blood droplets
     * from the exact wound point along the weapon cleave direction (dirX, dirZ).
     */
    const spawnArterialSpray = (
      x: number,
      y: number,
      z: number,
      baseCount: number,
      isFatalGore: boolean,
      dirX = 0,
      dirZ = 1
    ) => {
      const goreMult = settingsRef.current.goreIntensityMultiplier;
      if (goreMult <= 0.05) return;
      const count = Math.min(
        32,
        Math.max(5, Math.round(baseCount * Math.min(1.5, goreMult) * settingsRef.current.particleDensityMultiplier))
      );

      const baseAngle = Math.atan2(dirZ, dirX);
      const coneSpread = isFatalGore ? 1.15 : 0.72; // Directional spray cone

      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * coneSpread;
        const speed = 3.2 + Math.random() * (isFatalGore ? 6.8 : 4.6);
        const colorHex = i % 3 === 0 ? 0xb91c1c : i % 2 === 0 ? 0x7f1d1d : 0x450a0a;
        const mat = new THREE.MeshBasicMaterial({ color: colorHex });
        const mesh = new THREE.Mesh(dropGeo, mat);
        mesh.position.set(
          x + (Math.random() - 0.5) * 0.16,
          y + (Math.random() - 0.5) * 0.16,
          z + (Math.random() - 0.5) * 0.16
        );

        const baseScale = isFatalGore ? 0.85 + Math.random() * 0.55 : 0.65 + Math.random() * 0.45;
        mesh.scale.set(baseScale, baseScale, baseScale * 2.4);
        scene.add(mesh);

        const maxLife = 0.34 + Math.random() * 0.24;
        arterialDrops.push({
          mesh,
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
          vx: Math.cos(angle) * speed,
          vy: 1.8 + Math.random() * (isFatalGore ? 3.8 : 2.4),
          vz: Math.sin(angle) * speed,
          life: maxLife,
          maxLife,
          baseScale,
        });
      }
    };

    const spawnDismemberedGibs = (enemy: Enemy3DEntity, strikeDirX = 1, strikeDirZ = 0) => {
      // Collapse torso onto the arena floor
      enemy.headGroup.visible = false;
      enemy.weaponArmGroup.visible = false;
      enemy.hpBarMesh.visible = false;
      enemy.postureRingMesh.visible = false;
      enemy.group.position.set(enemy.x, 0.34, enemy.z);
      enemy.group.rotation.set(Math.PI / 2, enemy.group.rotation.y, 0.2);

      if (!settingsRef.current.dismembermentEnabled || settingsRef.current.goreIntensityMultiplier <= 0.2) {
        return;
      }

      // Detach demon head and launch it along the weapon cleave vector
      const severedHead = enemy.headGroup.clone();
      severedHead.visible = true;
      severedHead.position.set(enemy.x, 1.95, enemy.z);
      scene.add(severedHead);
      severedGibs.push({
        mesh: severedHead,
        x: enemy.x,
        y: 1.95,
        z: enemy.z,
        vx: strikeDirX * (3.8 + Math.random() * 2.4) + (Math.random() - 0.5) * 1.8,
        vy: 4.2 + Math.random() * 2.2,
        vz: strikeDirZ * (3.8 + Math.random() * 2.4) + (Math.random() - 0.5) * 1.8,
        rx: (Math.random() - 0.5) * 11,
        ry: (Math.random() - 0.5) * 11,
        rz: (Math.random() - 0.5) * 11,
        life: 10.0,
        bounces: 0,
      });

      // Detach demon weapon arm
      const severedArm = enemy.weaponArmGroup.clone();
      severedArm.visible = true;
      severedArm.position.set(enemy.x, 1.45, enemy.z);
      scene.add(severedArm);
      severedGibs.push({
        mesh: severedArm,
        x: enemy.x,
        y: 1.45,
        z: enemy.z,
        vx: strikeDirX * (3.2 + Math.random() * 2.2) + (Math.random() - 0.5) * 2.2,
        vy: 3.4 + Math.random() * 1.8,
        vz: strikeDirZ * (3.2 + Math.random() * 2.2) + (Math.random() - 0.5) * 2.2,
        rx: (Math.random() - 0.5) * 12,
        ry: (Math.random() - 0.5) * 12,
        rz: (Math.random() - 0.5) * 12,
        life: 10.0,
        bounces: 0,
      });
    };

    // Player & Arena State
    let playerX = -1.8;
    let playerZ = 0.4;
    let facingAngle = Math.PI / 2;
    let playerWalkCycle = 0;
    let dashTimer = 0;
    let dashCooldown = 0;
    let attackAnimTimer = 0;
    let flintCooldown = 0;
    let invulnTimer = 0;
    let cameraShake = 0;
    let hitstopTimer = 0;
    let nextEnemyId = 1;
    let killsInEpoch = 0;
    const targetKillsPerEpoch = 10;
    let bossSpawned = false;
    let currentEpochTracked = runStateRef.current.epochIndex;

    const keysDown = new Set<string>();

    const getEpochBossTitle = (epochIdx: number): string => {
      if (epochIdx === 4 || epochIdx === 5) return 'ضحاک ماردوش (Biwarasp Zahhak)';
      if (epochIdx === 6) return 'دیو سفید مازندران (Div-e Sepid)';
      if (epochIdx === 7) return 'پهلوان زره‌پوش توران (Turanian Vanguard)';
      if (epochIdx === 8) return 'افراسیاب شاه توران (Afrasiab of Turan)';
      if (epochIdx === 9) return 'اسفندیار روئین‌تن (Esfandiyar the Brazen-Bodied)';
      if (epochIdx === 10) return 'شغاد پیمان‌شکن و شاه کابل (Shaghad of Kabul)';
      if (epochIdx >= 11) return 'سپاه اهریمن در واپسین نبرد (Final Host of Ahriman)';
      return 'دیو سیاه مازندران (Div-e Siah)';
    };

    const spawnEnemy3D = (archetype: EnemyArchetype, x: number, z: number) => {
      const isBoss = archetype === 'div_siah_boss';
      const epochIdx = runStateRef.current.epochIndex;
      const built = buildDivEnemyGroup(archetype, isBoss, epochIdx);
      built.group.position.set(x, 0, z);
      scene.add(built.group);

      const diffScale = settingsRef.current.enemyAggressionScale;
      const maxHp = isBoss
        ? Math.round(240 * diffScale)
        : archetype === 'poulad_charger'
        ? Math.round(95 * diffScale)
        : Math.round(65 * diffScale);

      enemies.push({
        id: nextEnemyId++,
        archetype,
        name: isBoss
          ? getEpochBossTitle(epochIdx)
          : archetype === 'poulad_charger'
          ? 'دیو پولادوند (Poulad-Ghodrat)'
          : archetype === 'jadu_kiter'
          ? 'جادوگر اهریمن (Jadu Sorcerer)'
          : 'گرگ‌دیو البرز (Gurg-Div)',
        x,
        z,
        vx: 0,
        vz: 0,
        hp: maxHp,
        maxHp,
        posture: 0,
        maxPosture: isBoss ? 140 : 75,
        radius: isBoss ? 1.55 : 1.05,
        speed: (isBoss ? 4.4 : archetype === 'gurg_swarmer' ? 6.0 : 4.7) * diffScale,
        damage: Math.round((isBoss ? 22 : 13) * diffScale),
        state: 'seeking',
        stateTimer: 0,
        telegraphDuration: isBoss ? 0.65 : 0.55,
        attackCooldown: 0.8,
        hitFlashTimer: 0,
        phaseOffset: Math.random() * Math.PI * 2,
        walkCycle: Math.random() * Math.PI * 2,
        group: built.group,
        headGroup: built.headGroup,
        leftLegGroup: built.leftLegGroup,
        rightLegGroup: built.rightLegGroup,
        leftArmGroup: built.leftArmGroup,
        weaponArmGroup: built.weaponArmGroup,
        hpBarMesh: built.hpBarMesh,
        postureRingMesh: built.postureRingMesh,
      });
    };

    const resetWaveForEpoch = () => {
      enemies.forEach((e) => scene.remove(e.group));
      enemies.length = 0;
      projectiles.forEach((p) => scene.remove(p.mesh));
      projectiles.length = 0;
      bloodPools.forEach((b) => scene.remove(b.mesh));
      bloodPools.length = 0;
      killsInEpoch = 0;
      bossSpawned = false;
      playerX = -1.8;
      playerZ = 0.4;
      facingAngle = Math.PI / 2;
      braziers3D.forEach((b) => {
        const startLit = b.z < 0;
        b.ignited = startLit;
        (b.flameMesh.material as THREE.MeshBasicMaterial).opacity = startLit ? 0.92 : 0;
        b.light.intensity = startLit ? 3.4 : 0;
      });

      // Subtle, realistic initial battle scars in center ring
      spawnBloodPool(0.8, 0.2, 0.55, 0.4);
      spawnBloodPool(2.1, -0.9, 0.48, 1.2);

      // Spawn Div horde in center melee range
      spawnEnemy3D('gurg_swarmer', 1.2, 0.2);
      spawnEnemy3D('poulad_charger', 2.5, -1.2);
      spawnEnemy3D('gurg_swarmer', 0.4, -1.6);
      spawnEnemy3D('div_siah_boss', 3.4, 0.8);
    };

    resetWaveForEpoch();

    // Perform Primary Mace Cleave [Space / J]
    const triggerMaceStrike = (isHeavyMythic = false) => {
      if (attackAnimTimer > 0.05) return;
      attackAnimTimer = isHeavyMythic ? 0.36 : 0.24;
      if (isHeavyMythic) {
        soundEngine.playMythicNova(runStateRef.current.alignment >= 0);
      } else {
        soundEngine.playSwordSlash();
      }

      const braziersLit = braziers3D.filter((b) => b.ignited).length;
      const dmg = computePlayerAttackDamage(
        28,
        runStateRef.current.attackMultiplier,
        runStateRef.current.alignment,
        isHeavyMythic,
        braziersLit
      );

      const reach = isHeavyMythic ? 6.2 : 4.1;
      let hitAny = false;

      enemies.forEach((enemy) => {
        if (enemy.state === 'ko') return;
        const dx = enemy.x - playerX;
        const dz = enemy.z - playerZ;
        const dist = Math.hypot(dx, dz) || 1;
        if (dist <= reach + enemy.radius) {
          hitAny = true;
          enemy.hp -= dmg;
          enemy.posture = Math.min(enemy.maxPosture, enemy.posture + (isHeavyMythic ? 55 : 28));
          enemy.hitFlashTimer = 0.16;

          const dirX = dx / dist;
          const dirZ = dz / dist;
          const pushAngle = Math.atan2(dz, dx);
          enemy.x = Math.max(-17.5, Math.min(17.5, enemy.x + dirX * 1.25));
          enemy.z = Math.max(-11.5, Math.min(11.5, enemy.z + dirZ * 1.25));

          // Directional arterial spray along weapon cleave vector + proportionate floor splatter
          const isFatal = enemy.hp <= 0;
          spawnArterialSpray(
            enemy.x,
            1.42,
            enemy.z,
            isHeavyMythic ? 18 : 10,
            isFatal,
            dirX,
            dirZ
          );
          spawnBloodPool(
            enemy.x + dirX * 0.35,
            enemy.z + dirZ * 0.35,
            isFatal ? 0.82 : 0.44,
            pushAngle
          );

          if (enemy.posture >= enemy.maxPosture && enemy.hp > 0) {
            enemy.state = 'bound';
            enemy.stateTimer = 4.0;
          }

          if (isFatal) {
            enemy.hp = 0;
            enemy.state = 'ko';
            soundEngine.playBloodSplatterGore(true);
            spawnDismemberedGibs(enemy, dirX, dirZ);
            killsInEpoch++;
            callbacksRef.current.onSyncRunState((prev) => ({
              ...prev,
              hp: Math.min(prev.maxHp, prev.hp + prev.lifestealOnKill),
              mythicEnergy: Math.min(100, prev.mythicEnergy + 16),
              score: prev.score + (enemy.archetype === 'div_siah_boss' ? 350 : 100),
              enemiesVanquished: prev.enemiesVanquished + 1,
            }));
          } else {
            soundEngine.playBloodSplatterGore(false);
          }
        }
      });

      if (hitAny) {
        cameraShake = (isHeavyMythic ? 0.55 : 0.26) * settingsRef.current.cameraShakeIntensity;
        hitstopTimer = 0.04 * settingsRef.current.hitstopScale;
      }
    };

    // Perform Sang-e Sadeh Flint Parry & Brazier Ignition [Key Q]
    const triggerSadehFlint = () => {
      if (flintCooldown > 0) return;
      flintCooldown = 1.1;

      let litCount = 0;
      braziers3D.forEach((b) => {
        const d = Math.hypot(b.x - playerX, b.z - playerZ);
        if (!b.ignited && d <= 6.2) {
          b.ignited = true;
          (b.flameMesh.material as THREE.MeshBasicMaterial).opacity = 0.92;
          b.light.intensity = 3.5;
        }
        if (b.ignited) litCount++;
      });

      projectiles.forEach((proj) => {
        if (Math.hypot(proj.x - playerX, proj.z - playerZ) <= 5.5) {
          proj.vx = -proj.vx * 1.5;
          proj.vz = -proj.vz * 1.5;
          proj.reflectedByPlayer = true;
        }
      });

      let anyParried = false;
      enemies.forEach((enemy) => {
        if (enemy.state === 'ko') return;
        const dx = enemy.x - playerX;
        const dz = enemy.z - playerZ;
        const d = Math.hypot(dx, dz) || 1;
        if (d <= 5.8) {
          const res = computeSadehFlintCounter(
            enemy.state === 'telegraph' || enemy.state === 'attacking',
            runStateRef.current.sacredFireGuard,
            litCount
          );
          if (res.parrySuccess) anyParried = true;
          enemy.hp -= res.damage;
          enemy.posture = Math.min(enemy.maxPosture, enemy.posture + res.postureDamage);
          spawnArterialSpray(enemy.x, 1.5, enemy.z, 10, res.parrySuccess, dx / d, dz / d);
          if (enemy.posture >= enemy.maxPosture && enemy.hp > 0) {
            enemy.state = 'bound';
            enemy.stateTimer = 4.5;
          }
          if (enemy.hp <= 0) {
            enemy.hp = 0;
            enemy.state = 'ko';
            spawnDismemberedGibs(enemy, dx / d, dz / d);
            killsInEpoch++;
          }
        }
      });

      soundEngine.playFlintSparkParry(anyParried);
      callbacksRef.current.onSyncRunState((prev) => ({
        ...prev,
        braziersLit: litCount,
        mythicEnergy: Math.min(100, prev.mythicEnergy + (anyParried ? 24 : 10)),
      }));
    };

    // Perform Kemend-e Divband Brutal Gore Execution [Key F]
    const triggerDivBandFinisher = () => {
      const target = enemies.find(
        (e) =>
          e.state !== 'ko' &&
          (e.state === 'bound' || e.posture >= e.maxPosture * 0.75 || e.hp <= e.maxHp * 0.35) &&
          Math.hypot(e.x - playerX, e.z - playerZ) <= 6.5
      );
      if (!target) return;

      soundEngine.playDivBindFinisher();
      const fin = resolveDivBandFinisher(runStateRef.current);
      callbacksRef.current.onSyncRunState(() => fin.nextState);

      const dx = target.x - playerX;
      const dz = target.z - playerZ;
      const dist = Math.hypot(dx, dz) || 1;
      const dirX = dx / dist;
      const dirZ = dz / dist;

      spawnArterialSpray(target.x, 1.75, target.z, 24, true, dirX, dirZ);
      spawnBloodPool(target.x, target.z, 0.95, Math.atan2(dz, dx));
      spawnDismemberedGibs(target, dirX, dirZ);

      target.hp = 0;
      target.state = 'ko';
      killsInEpoch++;
      cameraShake = 0.65 * settingsRef.current.cameraShakeIntensity;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.code);
      if (gameStateRef.current !== 'playing' || isModalOpenRef.current) return;

      if (e.code === 'Space' || e.code === 'KeyJ') {
        e.preventDefault();
        triggerMaceStrike(false);
      } else if (e.code === 'KeyE' || e.code === 'KeyK') {
        e.preventDefault();
        if (runStateRef.current.mythicEnergy >= 35) {
          callbacksRef.current.onSyncRunState((prev) => ({
            ...prev,
            mythicEnergy: Math.max(0, prev.mythicEnergy - 35),
          }));
          triggerMaceStrike(true);
        } else {
          triggerMaceStrike(false);
        }
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        triggerSadehFlint();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        triggerDivBandFinisher();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (dashCooldown <= 0) {
          dashTimer = 0.18;
          dashCooldown = 0.65;
          invulnTimer = 0.25;
          soundEngine.playDash();
        }
      } else if (e.code === 'KeyO') {
        callbacksRef.current.onOpenSettings();
      } else if (e.code === 'KeyM') {
        callbacksRef.current.onToggleMute();
      } else if (e.code === 'KeyP') {
        callbacksRef.current.onTriggerPause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
    };

    const handleGoreBurstEvent = () => {
      triggerMaceStrike(true);
      triggerDivBandFinisher();
      const dirX = Math.sin(facingAngle);
      const dirZ = Math.cos(facingAngle);
      spawnArterialSpray(
        playerX + dirX * 1.35,
        1.5,
        playerZ + dirZ * 1.35,
        20,
        true,
        dirX,
        dirZ
      );
      spawnBloodPool(
        playerX + dirX * 1.5,
        playerZ + dirZ * 1.5,
        0.78,
        Math.atan2(dirZ, dirX)
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('shahnameh-trigger-gore-burst', handleGoreBurstEvent);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;
    let attractStrikeCooldown = 0.45;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const rawDt = clock.getDelta();
      const dt = clampDt(rawDt);
      const elapsed = clock.getElapsedTime();

      if (currentEpochTracked !== runStateRef.current.epochIndex) {
        currentEpochTracked = runStateRef.current.epochIndex;
        resetWaveForEpoch();
      }

      const isPlayingOrAttract =
        (gameStateRef.current === 'playing' || gameStateRef.current === 'title') &&
        !isModalOpenRef.current;

      if (isPlayingOrAttract) {
        if (hitstopTimer > 0) {
          hitstopTimer -= dt;
        } else {
          let mx = 0;
          let mz = 0;
          if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) mz -= 1;
          if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) mz += 1;
          if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) mx -= 1;
          if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) mx += 1;

          // Title Screen Attract-Mode Combat
          if (gameStateRef.current === 'title' && mx === 0 && mz === 0) {
            const liveTargets = enemies.filter((e) => e.state !== 'ko');
            const nearest = liveTargets[0];
            if (nearest) {
              const dx = nearest.x - playerX;
              const dz = nearest.z - playerZ;
              const dist = Math.hypot(dx, dz);
              facingAngle = Math.atan2(dx, dz);
              if (dist > 1.85) {
                mx = dx / dist;
                mz = dz / dist;
              }
              attractStrikeCooldown -= dt;
              if (dist <= 3.1 && attractStrikeCooldown <= 0) {
                attractStrikeCooldown = 0.85;
                triggerMaceStrike(killsInEpoch % 2 === 1);
                if (nearest.state === 'bound' || nearest.hp <= nearest.maxHp * 0.45) {
                  triggerDivBandFinisher();
                }
              }
            }
          }

          const moveLen = Math.hypot(mx, mz);
          const speed = dashTimer > 0 ? 19.5 : 8.4;
          if (moveLen > 0.01) {
            mx /= moveLen;
            mz /= moveLen;
            playerX = Math.max(-14.5, Math.min(14.5, playerX + mx * speed * dt));
            playerZ = Math.max(-9.5, Math.min(9.5, playerZ + mz * speed * dt));
            facingAngle = Math.atan2(mx, mz);
            playerWalkCycle += dt * (dashTimer > 0 ? 22 : 12);
          } else {
            playerWalkCycle = 0;
          }

          if (dashTimer > 0) dashTimer -= dt;
          if (dashCooldown > 0) dashCooldown -= dt;
          if (flintCooldown > 0) flintCooldown -= dt;
          if (invulnTimer > 0) invulnTimer -= dt;
          if (attackAnimTimer > 0) attackAnimTimer -= dt;

          // Update Articulated Hero 3D Transform, Leg Stride, Shield & Mace Swing
          heroModel.root.position.set(playerX, 0, playerZ);
          heroModel.root.rotation.y = THREE.MathUtils.damp(
            heroModel.root.rotation.y,
            facingAngle,
            14,
            dt
          );

          const strideSwing = moveLen > 0.01 ? Math.sin(playerWalkCycle) * 0.52 : 0;
          heroModel.leftLegGroup.rotation.x = strideSwing;
          heroModel.rightLegGroup.rotation.x = -strideSwing;
          heroModel.leftArmGroup.rotation.x = -strideSwing * 0.35;
          heroModel.capeMesh.rotation.x = 0.18 + (moveLen > 0.01 ? 0.25 + Math.abs(strideSwing) * 0.2 : 0);

          heroModel.weaponPivot.rotation.x =
            attackAnimTimer > 0
              ? -Math.sin((1 - attackAnimTimer / 0.36) * Math.PI) * 1.65
              : strideSwing * 0.3;
          heroModel.haloMesh.rotation.z = elapsed * 0.8;

          // Spawn reinforcement wave or Boss
          const activeEnemies = enemies.filter((e) => e.state !== 'ko');
          if (
            activeEnemies.length < 4 &&
            (killsInEpoch < targetKillsPerEpoch || gameStateRef.current === 'title')
          ) {
            const types: EnemyArchetype[] = ['gurg_swarmer', 'poulad_charger', 'jadu_kiter'];
            const pick = types[(killsInEpoch + activeEnemies.length) % types.length];
            const side = (killsInEpoch + activeEnemies.length) % 2 === 0 ? 4.2 : -4.2;
            spawnEnemy3D(pick, side, (Math.random() - 0.5) * 3.8);
          } else if (!bossSpawned && killsInEpoch >= 2) {
            bossSpawned = true;
            spawnEnemy3D('div_siah_boss', 3.6, -0.5);
          }

          if (
            gameStateRef.current === 'playing' &&
            killsInEpoch >= targetKillsPerEpoch &&
            activeEnemies.length === 0
          ) {
            callbacksRef.current.onEpochWaveCleared();
          }

          // Update Articulated Enemies
          let tokenAvailable = true;
          activeEnemies.forEach((enemy) => {
            if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer -= dt;
            if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

            let isMoving = false;

            if (enemy.state === 'bound') {
              enemy.stateTimer -= dt;
              enemy.postureRingMesh.rotation.z += dt * 4;
              (enemy.postureRingMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
              (enemy.postureRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
              if (enemy.stateTimer <= 0) {
                enemy.state = 'seeking';
                enemy.posture = Math.max(0, enemy.maxPosture * 0.4);
              }
            } else if (enemy.state === 'telegraph') {
              enemy.stateTimer -= dt;
              (enemy.postureRingMesh.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
              (enemy.postureRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
              enemy.weaponArmGroup.rotation.x = -1.05;
              if (enemy.stateTimer <= 0) {
                enemy.state = 'attacking';
                enemy.stateTimer = 0.22;
                if (enemy.archetype === 'jadu_kiter') {
                  const ang = Math.atan2(playerZ - enemy.z, playerX - enemy.x);
                  const orbGeo = new THREE.SphereGeometry(0.24, 10, 10);
                  const orbMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
                  const orbMesh = new THREE.Mesh(orbGeo, orbMat);
                  orbMesh.position.set(enemy.x, 1.45, enemy.z);
                  scene.add(orbMesh);
                  projectiles.push({
                    mesh: orbMesh,
                    x: enemy.x,
                    z: enemy.z,
                    vx: Math.cos(ang) * 11,
                    vz: Math.sin(ang) * 11,
                    radius: 0.35,
                    damage: enemy.damage,
                    life: 3.0,
                    reflectedByPlayer: false,
                  });
                }
              }
            } else if (enemy.state === 'attacking') {
              enemy.stateTimer -= dt;
              enemy.weaponArmGroup.rotation.x = 0.75;
              const dx = playerX - enemy.x;
              const dz = playerZ - enemy.z;
              const d = Math.hypot(dx, dz) || 1;
              if (d <= enemy.radius + 1.25 && invulnTimer <= 0) {
                invulnTimer = 0.55;
                const dmgTaken = computePlayerDamageReceived(
                  enemy.damage,
                  runStateRef.current.sacredFireGuard,
                  runStateRef.current.iranshahrStability
                );
                soundEngine.playPlayerHurt();
                spawnArterialSpray(playerX, 1.4, playerZ, 8, false, dx / d, dz / d);
                cameraShake = 0.42 * settingsRef.current.cameraShakeIntensity;
                callbacksRef.current.onSyncRunState((prev) => {
                  const nextHp = Math.max(0, prev.hp - dmgTaken);
                  if (nextHp <= 0) {
                    setTimeout(() => callbacksRef.current.onPlayerDefeated(), 40);
                  }
                  return { ...prev, hp: nextHp };
                });
              }
              if (enemy.stateTimer <= 0) {
                enemy.state = 'recovering';
                enemy.stateTimer = 0.45;
                enemy.attackCooldown = 1.1;
              }
            } else if (enemy.state === 'recovering') {
              enemy.stateTimer -= dt;
              enemy.weaponArmGroup.rotation.x = 0;
              if (enemy.stateTimer <= 0) enemy.state = 'seeking';
            } else {
              const UNIT_SCALE_2D = 36;
              const policy = evaluateEnemyPolicy(
                enemy.archetype,
                enemy.x * UNIT_SCALE_2D,
                enemy.z * UNIT_SCALE_2D,
                playerX * UNIT_SCALE_2D,
                playerZ * UNIT_SCALE_2D,
                enemy.speed * UNIT_SCALE_2D,
                enemy.attackCooldown <= 0,
                tokenAvailable,
                elapsed + enemy.phaseOffset
              );
              const stepX = (policy.vx / UNIT_SCALE_2D) * dt;
              const stepZ = (policy.vy / UNIT_SCALE_2D) * dt;
              enemy.x = Math.max(-16.5, Math.min(16.5, enemy.x + stepX));
              enemy.z = Math.max(-10.5, Math.min(10.5, enemy.z + stepZ));
              isMoving = Math.hypot(stepX, stepZ) > 0.002;
              if (policy.shouldStartTelegraph) {
                tokenAvailable = false;
                enemy.state = 'telegraph';
                enemy.stateTimer = enemy.telegraphDuration;
                soundEngine.playTelegraphWarning();
              }
            }

            // Articulated Bipedal Walk Stride for Divs
            if (isMoving) {
              enemy.walkCycle += dt * 10;
              const legSwing = Math.sin(enemy.walkCycle) * 0.46;
              enemy.leftLegGroup.rotation.x = legSwing;
              enemy.rightLegGroup.rotation.x = -legSwing;
              enemy.leftArmGroup.rotation.x = -legSwing * 0.4;
              if (enemy.state === 'seeking') {
                enemy.weaponArmGroup.rotation.x = legSwing * 0.35;
              }
            } else {
              enemy.leftLegGroup.rotation.x = 0;
              enemy.rightLegGroup.rotation.x = 0;
            }

            enemy.group.position.set(enemy.x, 0, enemy.z);
            enemy.group.rotation.y = Math.atan2(playerX - enemy.x, playerZ - enemy.z);
            enemy.hpBarMesh.scale.x = Math.max(0.05, enemy.hp / enemy.maxHp);
            enemy.hpBarMesh.lookAt(camera.position);
          });

          // Update Projectiles
          for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.x += p.vx * dt;
            p.z += p.vz * dt;
            p.life -= dt;
            p.mesh.position.set(p.x, 1.45, p.z);

            if (
              !p.reflectedByPlayer &&
              Math.hypot(p.x - playerX, p.z - playerZ) <= 1.15 &&
              invulnTimer <= 0
            ) {
              invulnTimer = 0.45;
              const dmg = computePlayerDamageReceived(
                p.damage,
                runStateRef.current.sacredFireGuard,
                runStateRef.current.iranshahrStability
              );
              spawnArterialSpray(playerX, 1.4, playerZ, 7, false, p.vx, p.vz);
              callbacksRef.current.onSyncRunState((prev) => ({
                ...prev,
                hp: Math.max(0, prev.hp - dmg),
              }));
              scene.remove(p.mesh);
              projectiles.splice(i, 1);
              continue;
            }
            if (p.life <= 0) {
              scene.remove(p.mesh);
              projectiles.splice(i, 1);
            }
          }
        }
      }

      // Update Directional Arterial Blood Droplets (Velocity-Stretched & Fast Gravity)
      for (let i = arterialDrops.length - 1; i >= 0; i--) {
        const drop = arterialDrops[i];
        drop.vy -= 34 * dt; // Realistic gravity pull
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;
        drop.z += drop.vz * dt;
        drop.life -= dt;

        // Orient elongated droplet along its velocity vector
        drop.mesh.position.set(drop.x, drop.y, drop.z);
        _lookTarget.set(drop.x + drop.vx, drop.y + drop.vy, drop.z + drop.vz);
        drop.mesh.lookAt(_lookTarget);

        // Hit floor -> spawn small satellite splatter and remove droplet immediately
        if (drop.y <= 0.03 || drop.life <= 0) {
          if (drop.y <= 0.03 && Math.random() < 0.14) {
            spawnBloodPool(
              drop.x,
              drop.z,
              0.22 + Math.random() * 0.18,
              Math.atan2(drop.vz, drop.vx)
            );
          }
          scene.remove(drop.mesh);
          (drop.mesh.material as THREE.Material).dispose();
          arterialDrops.splice(i, 1);
        }
      }

      // Update Severed Demon Heads & Limbs (Dismemberment Gibs)
      for (let i = severedGibs.length - 1; i >= 0; i--) {
        const gib = severedGibs[i];
        gib.vy -= 26 * dt;
        gib.x += gib.vx * dt;
        gib.y += gib.vy * dt;
        gib.z += gib.vz * dt;
        gib.mesh.rotation.x += gib.rx * dt;
        gib.mesh.rotation.y += gib.ry * dt;
        gib.mesh.rotation.z += gib.rz * dt;
        gib.life -= dt;

        if (gib.y <= 0.24) {
          gib.y = 0.24;
          gib.vy = Math.abs(gib.vy) * 0.35;
          gib.vx *= 0.58;
          gib.vz *= 0.58;
          gib.rx *= 0.6;
          gib.ry *= 0.6;
          gib.rz *= 0.6;
          if (gib.bounces < 2) {
            gib.bounces++;
            spawnBloodPool(gib.x, gib.z, 0.42);
          }
        }
        gib.mesh.position.set(gib.x, gib.y, gib.z);
        if (gib.life <= 0) {
          scene.remove(gib.mesh);
          severedGibs.splice(i, 1);
        }
      }

      // Smoothly expand Blood Pools on Floor
      bloodPools.forEach((pool) => {
        pool.scale = THREE.MathUtils.damp(pool.scale, pool.targetScale, 6, dt);
        pool.mesh.scale.setScalar(pool.scale);
      });

      // Animate Sadeh Braziers
      braziers3D.forEach((b, idx) => {
        if (b.ignited) {
          b.flameMesh.scale.y = 0.9 + Math.sin(elapsed * 9 + idx) * 0.2;
          b.light.intensity = 3.2 + Math.sin(elapsed * 11 + idx) * 0.6;
        }
      });

      // Smooth Exponential Camera Damping + Combat Shake
      if (cameraShake > 0) cameraShake = Math.max(0, cameraShake - dt * 2.6);
      const shakeX = (Math.random() - 0.5) * cameraShake;
      const shakeZ = (Math.random() - 0.5) * cameraShake;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, playerX * 0.35 + shakeX, 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 13.2 + playerZ * 0.25 + shakeZ, 5, dt);
      camera.lookAt(playerX * 0.25, 1.0, playerZ * 0.2);

      // Sync Telemetry to HUD
      const activeEnemies = enemies.filter((e) => e.state !== 'ko');
      const boss = activeEnemies.find((e) => e.archetype === 'div_siah_boss');
      callbacksRef.current.onSyncTelemetry({
        hp: runStateRef.current.hp,
        maxHp: runStateRef.current.maxHp,
        trailingHp: runStateRef.current.hp,
        mythicEnergy: runStateRef.current.mythicEnergy,
        waveProgress: Math.min(100, Math.round((killsInEpoch / targetKillsPerEpoch) * 100)),
        bossActive: !!boss,
        bossName: boss ? boss.name : '',
        bossHp: boss ? boss.hp : 0,
        bossMaxHp: boss ? boss.maxHp : 100,
        activeEnemyCount: activeEnemies.length,
        boundEnemiesCount: activeEnemies.filter((e) => e.state === 'bound').length,
        braziersLit: braziers3D.filter((b) => b.ignited).length,
        flintReady: flintCooldown <= 0,
      });

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('shahnameh-trigger-gore-burst', handleGoreBurstEvent);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#0B0706]"
      aria-label="Three.js 3D Extreme Gore & Persian Action Arena"
    />
  );
};
