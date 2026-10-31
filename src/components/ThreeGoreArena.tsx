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
  onRequestGoodEvilCrossroads?: () => void;
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
  onRequestGoodEvilCrossroads,
  onPlayerDefeated,
  onTriggerPause,
  onToggleMute,
  onOpenSettings,
  onQuickRestart,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

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
    onRequestGoodEvilCrossroads,
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
    onRequestGoodEvilCrossroads,
    onPlayerDefeated,
    onTriggerPause,
    onToggleMute,
    onOpenSettings,
    onQuickRestart,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(0x070504);
    scene.background = fogColor;
    scene.fog = new THREE.FogExp2(0x070504, 0.022);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.5, 160);
    camera.position.set(0, 10.6, 12.0);
    camera.lookAt(0, 1.0, 0);

    // Grimdark Moody Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x475569, 0x1a0806, 0.78);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffd28e, 2.35);
    keyLight.position.set(14, 26, 14);
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

    const rimLight = new THREE.DirectionalLight(0xb91c1c, 1.55);
    rimLight.position.set(-16, 12, -14);
    scene.add(rimLight);

    // =========================================================================
    // GRIMDARK MATURE PERSIAN TEXTURES
    // =========================================================================
    const createGrimdarkStoneFloorTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d')!;

      const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 360);
      grad.addColorStop(0, '#1B1411');
      grad.addColorStop(0.6, '#120D0B');
      grad.addColorStop(1, '#090706');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = 'rgba(8, 5, 4, 0.85)';
      ctx.lineWidth = 2;
      for (let y = 0; y < 512; y += 128) {
        for (let x = 0; x < 512; x += 128) {
          const ox = (y / 128) % 2 === 0 ? 0 : 64;
          ctx.strokeRect((x + ox) % 512, y, 128, 128);
          ctx.fillStyle =
            (x + y) % 256 === 0 ? 'rgba(42, 30, 23, 0.16)' : 'rgba(18, 12, 10, 0.22)';
          ctx.fillRect(((x + ox) % 512) + 3, y + 3, 122, 122);
        }
      }

      for (let i = 0; i < 140; i++) {
        const rx = (i * 73) % 512;
        const ry = (i * 137) % 512;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(68, 46, 32, 0.18)' : 'rgba(6, 4, 3, 0.35)';
        ctx.beginPath();
        ctx.arc(rx, ry, 2 + (i % 7), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(92, 61, 36, 0.28)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(256, 256, 180, 0, Math.PI * 2);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 2);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };

    const createLamellarArmorTexture = (
      primaryHex: string,
      secondaryHex: string,
      rivetHex: string
    ) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = primaryHex;
      ctx.fillRect(0, 0, 256, 256);

      for (let row = 0; row < 12; row++) {
        const y = row * 22;
        const offsetX = row % 2 === 0 ? 0 : 14;
        for (let col = -1; col < 10; col++) {
          const x = col * 28 + offsetX;
          ctx.fillStyle = row % 2 === 0 ? primaryHex : secondaryHex;
          ctx.strokeStyle = '#090706';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, 26, 24, [0, 0, 10, 10]);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = rivetHex;
          ctx.beginPath();
          ctx.arc(x + 13, y + 6, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const vignette = ctx.createLinearGradient(0, 0, 0, 256);
      vignette.addColorStop(0, 'rgba(0,0,0,0.35)');
      vignette.addColorStop(0.5, 'rgba(255,255,255,0.06)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 256, 256);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const createLeopardPeltTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#92400E';
      ctx.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 48; i++) {
        const x = ((i * 53) % 240) + 8;
        const y = ((i * 79) % 240) + 8;
        ctx.fillStyle = '#451A03';
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0C0A09';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0.3, Math.PI * 1.65);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const createBabrBayanTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#9A3412';
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = '#09090B';
      for (let y = 10; y < 250; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(128, y + (y % 44 === 0 ? 14 : -12), 256, y + 4);
        ctx.lineTo(256, y + 11);
        ctx.quadraticCurveTo(128, y + 6, 0, y + 8);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const createDerafshKavianiTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#3B0764';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, 236, 236);
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(24, 24, 208, 208);

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(128, 38);
      ctx.lineTo(152, 104);
      ctx.lineTo(218, 128);
      ctx.lineTo(152, 152);
      ctx.lineTo(128, 218);
      ctx.lineTo(104, 152);
      ctx.lineTo(38, 128);
      ctx.lineTo(104, 104);
      ctx.closePath();
      ctx.fill();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const leopardPeltTex = createLeopardPeltTexture();
    const babrBayanTex = createBabrBayanTexture();
    const derafshKavianiTex = createDerafshKavianiTexture();
    const royalGoldArmorTex = createLamellarArmorTexture('#78350F', '#92400E', '#F59E0B');
    const lapisGoodArmorTex = createLamellarArmorTexture('#1E3A8A', '#172554', '#D97706');
    const emeraldFereydunArmorTex = createLamellarArmorTexture('#064E3B', '#065F46', '#F59E0B');
    const turquoiseSohrabArmorTex = createLamellarArmorTexture('#115E59', '#0F766E', '#FDE68A');
    const sadehMagmaArmorTex = createLamellarArmorTexture('#27272A', '#451A03', '#EA580C');
    const kavehLeatherApronTex = createLamellarArmorTexture('#451A03', '#5C2D16', '#9A3412');
    const whiteSiyavashArmorTex = createLamellarArmorTexture('#CBD5E1', '#94A3B8', '#FDE68A');
    const brazenEsfandiyarArmorTex = createLamellarArmorTexture('#B45309', '#D97706', '#FEF08A');
    const sassanianRoyalArmorTex = createLamellarArmorTexture('#4C1D95', '#3B0764', '#F59E0B');
    const darkObsidianEvilArmorTex = createLamellarArmorTexture('#18181B', '#27272A', '#991B1B');
    const crimsonDemonArmorTex = createLamellarArmorTexture('#450A0A', '#7F1D1D', '#18181B');
    const whiteDivSepidFurTex = createLamellarArmorTexture('#E2E8F0', '#94A3B8', '#38BDF8');

    const floorTex = createGrimdarkStoneFloorTexture();
    const floorGeo = new THREE.PlaneGeometry(44, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: floorTex,
      bumpScale: 0.08,
      roughness: 0.78,
      metalness: 0.22,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    const duelRingGeo = new THREE.RingGeometry(5.5, 5.85, 64);
    duelRingGeo.rotateX(-Math.PI / 2);
    const duelRingMat = new THREE.MeshBasicMaterial({
      color: 0xb45309,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const duelRingMesh = new THREE.Mesh(duelRingGeo, duelRingMat);
    duelRingMesh.position.y = 0.03;
    scene.add(duelRingMesh);

    const cragCount = 38;
    const cragGeo = new THREE.DodecahedronGeometry(2.2, 0);
    cragGeo.translate(0, 1.4, 0);
    const cragMat = new THREE.MeshStandardMaterial({
      color: 0x14110f,
      roughness: 0.9,
      metalness: 0.15,
    });
    const cragInstanced = new THREE.InstancedMesh(cragGeo, cragMat, cragCount);
    for (let i = 0; i < cragCount; i++) {
      const t = i / Math.max(1, cragCount - 1);
      const angle = Math.PI * 0.86 + t * Math.PI * 1.28;
      const rx = Math.cos(angle) * 20.5 + Math.sin(i * 7) * 0.9;
      const rz = Math.sin(angle) * 14.2 + Math.cos(i * 5) * 0.8;
      _dummyObj.position.set(rx, -0.3, rz);
      _dummyObj.rotation.set(i * 0.2, i * 0.8, 0.1);
      const s = 0.85 + (i % 4) * 0.25;
      _dummyObj.scale.set(s, s * (1.4 + (i % 3) * 0.45), s);
      _dummyObj.updateMatrix();
      cragInstanced.setMatrixAt(i, _dummyObj.matrix);
      _colorScratch.setHex(i % 3 === 0 ? 0x1c1512 : i % 2 === 0 ? 0x111318 : 0x171311);
      cragInstanced.setColorAt(i, _colorScratch);
    }
    cragInstanced.instanceMatrix.needsUpdate = true;
    if (cragInstanced.instanceColor) cragInstanced.instanceColor.needsUpdate = true;
    cragInstanced.computeBoundingSphere();
    scene.add(cragInstanced);

    const contactShadowGeo = new THREE.CircleGeometry(0.9, 20);
    contactShadowGeo.rotateX(-Math.PI / 2);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    // =========================================================================
    // EPOCH & FACTION TITLES (12 DISTINCT EPOCHS)
    // =========================================================================
    const getEpochHeroTitle = (epochIdx: number, isFa: boolean, isEvilPlayer: boolean): string => {
      if (isEvilPlayer) {
        const faEvilHeroTitles = [
          'کیومرث اهریمن‌خو',
          'سیامک کینه‌توز تاریکی',
          'هوشنگ آتش‌افروز اهریمن',
          'طهمورث سیاه‌جادو',
          'ضحاک ماردوش (فرمانروای دوزخ)',
          'اژی‌دهاک اهریمنی',
          'سردار تاریکی مازندران',
          'افراسیاب خون‌ریز',
          'گرسیوز و افراسیاب توران',
          'اسفندیار کینه‌توز',
          'شغاد پیمان‌شکن کابل',
          'فرمانروای خشم اهریمن',
        ];
        const enEvilHeroTitles = [
          'Keyumars the Fallen',
          'Dark Warlord Siamak',
          'Hushang of the Hellfire',
          'Tahmuras the Necromancer',
          'Zahhak the Serpent Tyrant',
          'Azhi Dahaka Unbound',
          'Dark Warlord of Mazandaran',
          'Afrasiab the Bloodthirsty',
          'Garsivaz & Afrasiab',
          'Wrathful Esfandiyar',
          'Shaghad the Traitor',
          'Avatar of Ahriman’s Wrath',
        ];
        const list = isFa ? faEvilHeroTitles : enEvilHeroTitles;
        return list[Math.min(epochIdx, list.length - 1)] || list[0];
      }

      const faGoodHeroTitles = [
        'کیومرث پلنگینه‌پوش',
        'شاهزاده سیامک برهنه‌تن',
        'شاه هوشنگ با تبر آتش سده',
        'طهمورث دیوبند با کمند زرین',
        'کاوه آهنگر با پتک و درفش کاویانی',
        'فریدون فرخ با گرز گاوسار',
        'رستم دستان با ببر بیان',
        'رستم تهمتن (رزم با سهراب)',
        'شاهزاده سیاوش (گذر از آتش)',
        'رستم با کمان چاچی و تیر گز سیمرغ',
        'رستم زخم‌خورده در چاه شغاد',
        'رستم فرخزاد و پاسدار شاهنامه',
      ];
      const enGoodHeroTitles = [
        'Shah Keyumars in Leopard Pelt',
        'Prince Siamak',
        'Shah Hushang of the Sadeh Fire',
        'Tahmuras Divband',
        'Kaveh the Blacksmith',
        'Shah Fereydun',
        'Rostam Dastan in Babr-e Bayan',
        'Rostam Tahamtan',
        'Prince Siyavash of the Fire',
        'Rostam with Simurgh’s Tamarisk Arrow',
        'Wounded Rostam of Zabul',
        'Rostam Farrokhzad & Ferdowsi',
      ];
      const list = isFa ? faGoodHeroTitles : enGoodHeroTitles;
      return list[Math.min(epochIdx, list.length - 1)] || list[0];
    };

    const getEpochBossTitle = (epochIdx: number, isFa: boolean, isEvilPlayer: boolean): string => {
      if (isEvilPlayer) {
        const faGoodBosses = [
          'سروش ایزدی، فرشته نگهبان البرز',
          'سیامک پاک‌زاد، پهلوان روشنایی',
          'شاه هوشنگ، پاسدار آتش مقدس',
          'طهمورث، پهلوان اشه',
          'کاوه آهنگر با درفش کاویانی',
          'فریدون فرخ با گرز گاوسار',
          'رستم دستان، سپر ایران‌شهر',
          'سهراب یل، مدافع ایران‌شهر',
          'سیاوش پاک‌سرشت، شاهزاده‌ی آتش',
          'رستم تهمتن با تیر گز سیمرغ',
          'رستم دستان، انتقام‌جوی زابل',
          'حکیم فردوسی و جاودانان شاهنامه',
        ];
        const enGoodBosses = [
          'Soroush, Angelic Guardian of Alborz',
          'Prince Siamak of the Light',
          'Shah Hushang, Keeper of Sacred Fire',
          'Tahmuras, Paladin of Asha',
          'Kaveh with the Kaviani Banner',
          'Shah Fereydun the Glorious',
          'Rostam Dastan, Shield of Iranshahr',
          'Sohrab, Defender of Iran',
          'Prince Siyavash the Pure',
          'Rostam Tahamtan, Lion of Zabul',
          'Rostam Dastan, Avenger of Zabul',
          'Ferdowsi & the Immortal Guardians',
        ];
        const list = isFa ? faGoodBosses : enGoodBosses;
        return list[Math.min(epochIdx, list.length - 1)] || list[0];
      }

      const faEvilBosses = [
        'خزروان دیو سیاه البرز',
        'اهریمن کینه‌توز (کشنده‌ی سیامک)',
        'دیو خارا و اهریمن آتش‌خوار',
        'ارژنگ دیو، سردار جادوگران',
        'ضحاک ماردوش',
        'اژی‌دهاک دربند دماوند',
        'دیو سفید مازندران',
        'سهراب یل، سپهدار توران',
        'افراسیاب و گروی زره',
        'اسفندیار روئین‌تن',
        'شغاد پیمان‌شکن در پناه چنار',
        'دیو فراموشی و اهریمن تباهی',
      ];
      const enEvilBosses = [
        'Khazuran the Black Div',
        'Wrathful Demon of Ahriman',
        'Obsidian Demon of Mazandaran',
        'Arzhang Div, General of Darkness',
        'Biwarasp Zahhak',
        'Azhi Dahaka of Damavand',
        'Div-e Sepid of Mazandaran',
        'Young Champion Sohrab',
        'Afrasiab & Goruy Zereh',
        'Esfandiyar the Brazen-Bodied',
        'Shaghad Behind the Plane Tree',
        'Ahriman, Lord of Oblivion',
      ];
      const list = isFa ? faEvilBosses : enEvilBosses;
      return list[Math.min(epochIdx, list.length - 1)] || list[0];
    };

    const getMinionName = (
      archetype: EnemyArchetype,
      epochIdx: number,
      isFa: boolean,
      isEvilPlayer: boolean
    ): string => {
      if (isEvilPlayer) {
        if (epochIdx <= 1) return isFa ? 'پهلوان پلنگینه‌پوش البرز' : 'Alborz Leopard Hunter';
        if (epochIdx <= 3) return isFa ? 'نگهبان آتشکده‌ی سده' : 'Sadeh Fire Guardian';
        if (epochIdx <= 5) return isFa ? 'آهنگر قیام کاوه' : 'Kaveh’s Rebel Blacksmith';
        if (epochIdx <= 7) return isFa ? 'سوار زرین زابلستان' : 'Zabulistan Golden Cavalier';
        if (epochIdx <= 9) return isFa ? 'گارد جاویدان سیاوش و کیان' : 'Kayanian Immortal Guard';
        return isFa ? 'اسواران جاویدان ایران‌شهر' : 'Sassanian Savaran Knight';
      }
      if (epochIdx <= 1) return isFa ? 'گرگ‌دیو سیاه البرز' : 'Black Wolf-Div of Alborz';
      if (epochIdx <= 3) return isFa ? 'دیو آتش‌خوار و جادوگر' : 'Obsidian Warlock Div';
      if (epochIdx <= 5) return isFa ? 'ماردوش نگهبان ضحاک' : 'Zahhak’s Serpent Guard';
      if (epochIdx === 6) return isFa ? 'دیو سپیدموی مازندران' : 'Mazandaran Cave Div';
      if (epochIdx <= 9) return isFa ? 'مهاجم سیاه‌پوش توران' : 'Turanian Dark Raider';
      return isFa ? 'کمین‌زن زهرآگین کابل' : 'Kabul Venom Assassin';
    };

    // =========================================================================
    // STORY-ACCURATE 12-EPOCH CHARACTER BUILDER
    // Dynamically sculpts distinct headgear, hair/beard, torso armor/garment,
    // back props (Angel Wings, Serpents, Derafsh Kaviani, Plane Tree, Fire Halo),
    // and epoch-specific weapons for BOTH the Player, Soldiers, and Bosses!
    // =========================================================================
    type CharacterIdentity =
      | 'keyumars'
      | 'siamak'
      | 'hushang'
      | 'tahmuras'
      | 'kaveh'
      | 'fereydun'
      | 'rostam_mace'
      | 'rostam_bow'
      | 'rostam_wounded'
      | 'sohrab'
      | 'siyavash'
      | 'esfandiyar'
      | 'farrokhzad'
      | 'soroush_angel'
      | 'div_siah'
      | 'div_magma'
      | 'arzhang_warlock'
      | 'zahhak'
      | 'azhi_dahaka'
      | 'div_sepid'
      | 'afrasiab'
      | 'shaghad'
      | 'ahriman_void'
      | 'good_soldier'
      | 'evil_soldier';

    const resolveCharacterIdentity = (
      epochIdx: number,
      isGoodFaction: boolean,
      role: 'player' | 'boss' | 'charger' | 'kiter' | 'swarmer'
    ): CharacterIdentity => {
      if (role !== 'player' && role !== 'boss') {
        return isGoodFaction ? 'good_soldier' : 'evil_soldier';
      }

      // If this character belongs to the GOOD faction (either Good Player OR Good Boss when Player is Evil)
      if (isGoodFaction) {
        if (epochIdx === 0) return role === 'boss' ? 'soroush_angel' : 'keyumars';
        if (epochIdx === 1) return 'siamak';
        if (epochIdx === 2) return 'hushang';
        if (epochIdx === 3) return 'tahmuras';
        if (epochIdx === 4) return 'kaveh';
        if (epochIdx === 5) return 'fereydun';
        if (epochIdx === 6) return 'rostam_mace';
        if (epochIdx === 7) return role === 'boss' ? 'sohrab' : 'rostam_mace';
        if (epochIdx === 8) return 'siyavash';
        if (epochIdx === 9) return 'rostam_bow';
        if (epochIdx === 10) return 'rostam_wounded';
        return 'farrokhzad';
      }

      // If this character belongs to the EVIL / OPPOSING faction (either Evil Boss OR Evil Player)
      if (epochIdx === 0 || epochIdx === 1) return 'div_siah';
      if (epochIdx === 2) return 'div_magma';
      if (epochIdx === 3) return 'arzhang_warlock';
      if (epochIdx === 4) return 'zahhak';
      if (epochIdx === 5) return 'azhi_dahaka';
      if (epochIdx === 6) return 'div_sepid';
      if (epochIdx === 7) return role === 'boss' ? 'sohrab' : 'afrasiab';
      if (epochIdx === 8) return 'afrasiab';
      if (epochIdx === 9) return 'esfandiyar';
      if (epochIdx === 10) return 'shaghad';
      return 'ahriman_void';
    };

    const buildStoryCharacterRig = (opts: {
      scale: number;
      isGoodFaction: boolean;
      epochIdx: number;
      role: 'player' | 'boss' | 'charger' | 'kiter' | 'swarmer';
    }) => {
      const { isGoodFaction, epochIdx, role } = opts;
      const identity = resolveCharacterIdentity(epochIdx, isGoodFaction, role);

      // Adjust scale for Piltan Rostam, Giant Div-e Sepid, Youthful Sohrab/Siamak
      let scale = opts.scale;
      if (
        identity === 'rostam_mace' ||
        identity === 'rostam_bow' ||
        identity === 'rostam_wounded'
      ) {
        scale *= 1.12;
      } else if (identity === 'div_sepid' || identity === 'azhi_dahaka' || identity === 'ahriman_void') {
        scale *= 1.22;
      } else if (identity === 'siamak' || identity === 'sohrab') {
        scale *= 0.96;
      }

      const root = new THREE.Group();

      const shadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
      shadow.scale.setScalar(scale);
      shadow.position.y = 0.02;
      root.add(shadow);

      // Select Story-Specific Torso / Armor Material
      const getCuirassMaterial = () => {
        switch (identity) {
          case 'keyumars':
            return new THREE.MeshStandardMaterial({ map: leopardPeltTex, roughness: 0.65 });
          case 'siamak':
            // Bare-chested bronze muscular skin (`سیامک بیامد برهنه تنا`)
            return new THREE.MeshStandardMaterial({ color: 0xc68652, roughness: 0.55 });
          case 'hushang':
          case 'div_magma':
            return new THREE.MeshStandardMaterial({
              map: sadehMagmaArmorTex,
              emissive: 0x7c2d12,
              emissiveIntensity: 0.45,
              roughness: 0.35,
              metalness: 0.8,
            });
          case 'tahmuras':
            return new THREE.MeshStandardMaterial({
              map: lapisGoodArmorTex,
              roughness: 0.28,
              metalness: 0.85,
            });
          case 'kaveh':
            return new THREE.MeshStandardMaterial({
              map: kavehLeatherApronTex,
              roughness: 0.78,
              metalness: 0.15,
            });
          case 'fereydun':
            return new THREE.MeshStandardMaterial({
              map: emeraldFereydunArmorTex,
              roughness: 0.25,
              metalness: 0.88,
            });
          case 'rostam_mace':
          case 'rostam_bow':
          case 'rostam_wounded':
            return new THREE.MeshStandardMaterial({
              map: babrBayanTex,
              bumpMap: babrBayanTex,
              bumpScale: 0.04,
              roughness: 0.5,
              metalness: 0.3,
            });
          case 'sohrab':
            return new THREE.MeshStandardMaterial({
              map: turquoiseSohrabArmorTex,
              roughness: 0.28,
              metalness: 0.82,
            });
          case 'siyavash':
            return new THREE.MeshStandardMaterial({
              map: whiteSiyavashArmorTex,
              emissive: 0x334155,
              emissiveIntensity: 0.25,
              roughness: 0.2,
              metalness: 0.85,
            });
          case 'esfandiyar':
          case 'soroush_angel':
            return new THREE.MeshStandardMaterial({
              map: brazenEsfandiyarArmorTex,
              emissive: 0x78350f,
              emissiveIntensity: 0.35,
              roughness: 0.15,
              metalness: 0.96,
            });
          case 'farrokhzad':
            return new THREE.MeshStandardMaterial({
              map: sassanianRoyalArmorTex,
              roughness: 0.25,
              metalness: 0.88,
            });
          case 'div_sepid':
            return new THREE.MeshStandardMaterial({
              map: whiteDivSepidFurTex,
              roughness: 0.55,
              metalness: 0.2,
            });
          case 'zahhak':
          case 'azhi_dahaka':
          case 'ahriman_void':
            return new THREE.MeshStandardMaterial({
              map: crimsonDemonArmorTex,
              roughness: 0.32,
              metalness: 0.82,
            });
          case 'shaghad':
            return new THREE.MeshStandardMaterial({
              color: 0x14532d,
              roughness: 0.45,
              metalness: 0.7,
            });
          case 'good_soldier':
            return new THREE.MeshStandardMaterial({
              map:
                epochIdx <= 1
                  ? leopardPeltTex
                  : epochIdx <= 5
                  ? emeraldFereydunArmorTex
                  : royalGoldArmorTex,
              roughness: 0.32,
              metalness: 0.8,
            });
          default:
            return new THREE.MeshStandardMaterial({
              map: darkObsidianEvilArmorTex,
              roughness: 0.38,
              metalness: 0.8,
            });
        }
      };

      const cuirassMat = getCuirassMaterial();
      const skinMat = new THREE.MeshStandardMaterial({
        color:
          identity === 'div_sepid'
            ? 0xe2e8f0
            : identity === 'div_siah' || identity === 'ahriman_void'
            ? 0x18181b
            : identity === 'esfandiyar'
            ? 0xd97706
            : 0xd4996a,
        roughness: identity === 'esfandiyar' ? 0.18 : 0.52,
        metalness: identity === 'esfandiyar' ? 0.95 : 0.1,
      });

      const trimMetalMat = new THREE.MeshStandardMaterial({
        color:
          identity === 'siyavash'
            ? 0xe2e8f0
            : isGoodFaction || identity === 'esfandiyar' || identity === 'sohrab'
            ? 0xd97706
            : 0x991b1b,
        roughness: 0.22,
        metalness: 0.92,
      });

      const darkSteelMat = new THREE.MeshStandardMaterial({
        color: identity === 'esfandiyar' ? 0xb45309 : isGoodFaction ? 0x64748b : 0x18181b,
        roughness: 0.25,
        metalness: 0.92,
      });

      const bladeSteelMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        emissive: isGoodFaction ? 0x1e3a8a : 0x7f1d1d,
        emissiveIntensity: 0.22,
        roughness: 0.16,
        metalness: 0.96,
      });

      // 1. Legs
      const createLeg = (offsetX: number) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(offsetX * scale, 0.9 * scale, 0);

        const thighGeo = new THREE.CylinderGeometry(0.15 * scale, 0.12 * scale, 0.44 * scale, 8);
        thighGeo.translate(0, -0.22 * scale, 0);
        const thigh = new THREE.Mesh(
          thighGeo,
          identity === 'siamak' ? new THREE.MeshStandardMaterial({ map: leopardPeltTex }) : cuirassMat
        );
        legGroup.add(thigh);

        const knee = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.125 * scale, 0),
          trimMetalMat
        );
        knee.position.set(0, -0.44 * scale, 0.04 * scale);
        legGroup.add(knee);

        const shinGeo = new THREE.CylinderGeometry(0.12 * scale, 0.095 * scale, 0.44 * scale, 8);
        shinGeo.translate(0, -0.65 * scale, 0);
        const shin = new THREE.Mesh(
          shinGeo,
          identity === 'keyumars' || identity === 'siamak' ? skinMat : darkSteelMat
        );
        legGroup.add(shin);

        const boot = new THREE.Mesh(
          new THREE.BoxGeometry(0.2 * scale, 0.12 * scale, 0.34 * scale),
          darkSteelMat
        );
        boot.position.set(0, -0.85 * scale, 0.05 * scale);
        legGroup.add(boot);

        return legGroup;
      };

      const leftLegGroup = createLeg(-0.22);
      const rightLegGroup = createLeg(0.22);
      root.add(leftLegGroup, rightLegGroup);

      // 2. Waist, Belt & Tassets
      const pelvis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35 * scale, 0.38 * scale, 0.32 * scale, 8),
        identity === 'siamak' ? new THREE.MeshStandardMaterial({ map: leopardPeltTex }) : cuirassMat
      );
      pelvis.position.set(0, 0.98 * scale, 0);
      root.add(pelvis);

      const belt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.37 * scale, 0.37 * scale, 0.1 * scale, 10),
        trimMetalMat
      );
      belt.position.set(0, 1.1 * scale, 0);
      root.add(belt);

      if (identity !== 'siamak' && identity !== 'keyumars') {
        [-1, 1].forEach((side) => {
          const tasset = new THREE.Mesh(
            new THREE.BoxGeometry(0.12 * scale, 0.32 * scale, 0.28 * scale),
            trimMetalMat
          );
          tasset.position.set(side * 0.34 * scale, 0.92 * scale, 0);
          tasset.rotation.z = -side * 0.18;
          root.add(tasset);
        });
      }

      // 3. Torso & Epoch-Specific Chest Details
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48 * scale, 0.34 * scale, 0.82 * scale, 8),
        cuirassMat
      );
      torso.scale.set(1.14, 1.0, 0.76);
      torso.position.set(0, 1.5 * scale, 0);
      torso.castShadow = !isSoftwareGl;
      root.add(torso);

      // Siamak: Diagonal Leopard-Pelt Sash across bare chest
      if (identity === 'siamak') {
        const sash = new THREE.Mesh(
          new THREE.TorusGeometry(0.42 * scale, 0.065 * scale, 8, 18),
          new THREE.MeshStandardMaterial({ map: leopardPeltTex })
        );
        sash.position.set(0, 1.52 * scale, 0);
        sash.rotation.y = Math.PI / 2;
        sash.rotation.x = 0.65;
        root.add(sash);
      } else if (identity === 'kaveh') {
        // Kaveh: Heavy Leather Blacksmith Apron Plate on Front
        const apron = new THREE.Mesh(
          new THREE.BoxGeometry(0.58 * scale, 0.78 * scale, 0.16 * scale),
          cuirassMat
        );
        apron.position.set(0, 1.38 * scale, 0.22 * scale);
        root.add(apron);
      } else {
        const chestPlate = new THREE.Mesh(
          new THREE.BoxGeometry(0.55 * scale, 0.5 * scale, 0.18 * scale),
          cuirassMat
        );
        chestPlate.position.set(0, 1.56 * scale, 0.22 * scale);
        root.add(chestPlate);
      }

      // Wounded Rostam (Epoch 10 - Pit of Shaghad): Enemy spears/arrows embedded in armor!
      if (identity === 'rostam_wounded') {
        [-1, 1].forEach((s, idx) => {
          const brokenShaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.65 * scale, 6),
            darkSteelMat
          );
          brokenShaft.position.set(s * 0.28 * scale, (1.65 - idx * 0.22) * scale, 0.32 * scale);
          brokenShaft.rotation.x = 0.85;
          brokenShaft.rotation.z = s * 0.4;
          root.add(brokenShaft);
        });
      }

      // =======================================================================
      // EPOCH-SPECIFIC BACK & ENVIRONMENT PROPS
      // =======================================================================
      // A) Soroush Angelic Guardian (Epoch 0 Good Boss) or Farrokhzad Faravahar: Sweeping Golden Wings!
      if (identity === 'soroush_angel' || identity === 'farrokhzad') {
        [-1, 1].forEach((side) => {
          const wingGroup = new THREE.Group();
          wingGroup.position.set(side * 0.25 * scale, 1.78 * scale, -0.28 * scale);
          for (let f = 0; f < 4; f++) {
            const feather = new THREE.Mesh(
              new THREE.BoxGeometry(0.12 * scale, (0.95 - f * 0.16) * scale, 0.04 * scale),
              trimMetalMat
            );
            feather.position.set(side * (0.18 + f * 0.14) * scale, (0.2 - f * 0.08) * scale, 0);
            feather.rotation.z = -side * (0.45 + f * 0.18);
            wingGroup.add(feather);
          }
          root.add(wingGroup);
        });
      }

      // B) Zahhak & Azhi Dahaka (Epochs 4 & 5): Writhing Black Shoulder Serpents!
      if (identity === 'zahhak' || identity === 'azhi_dahaka') {
        const serpentMat = new THREE.MeshStandardMaterial({
          color: 0x09090b,
          roughness: 0.22,
          metalness: 0.78,
        });
        const redGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        [-1, 1].forEach((side) => {
          const sGroup = new THREE.Group();
          sGroup.position.set(side * 0.46 * scale, 1.88 * scale, 0.08 * scale);
          const coil = new THREE.Mesh(
            new THREE.TorusGeometry(0.24 * scale, 0.06 * scale, 8, 16, Math.PI * 1.35),
            serpentMat
          );
          coil.rotation.y = side * 0.4;
          sGroup.add(coil);

          const fangHead = new THREE.Mesh(
            new THREE.ConeGeometry(0.095 * scale, 0.26 * scale, 6),
            serpentMat
          );
          fangHead.rotation.x = Math.PI / 2;
          fangHead.position.set(side * 0.14 * scale, 0.24 * scale, 0.22 * scale);
          sGroup.add(fangHead);

          const sEye = new THREE.Mesh(
            new THREE.BoxGeometry(0.055 * scale, 0.022 * scale, 0.022 * scale),
            redGlowMat
          );
          sEye.position.set(side * 0.14 * scale, 0.27 * scale, 0.28 * scale);
          sGroup.add(sEye);
          root.add(sGroup);
        });
      }

      // C) Kaveh, Fereydun & Farrokhzad: Towering Derafsh Kaviani Royal Standard!
      if (identity === 'kaveh' || identity === 'fereydun' || identity === 'farrokhzad') {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032 * scale, 0.032 * scale, 2.9 * scale, 8),
          trimMetalMat
        );
        pole.position.set(-0.28 * scale, 2.35 * scale, -0.32 * scale);
        root.add(pole);

        const banner = new THREE.Mesh(
          new THREE.PlaneGeometry(0.95 * scale, 1.18 * scale),
          new THREE.MeshStandardMaterial({
            map: derafshKavianiTex,
            side: THREE.DoubleSide,
            roughness: 0.4,
          })
        );
        banner.position.set(-0.28 * scale, 3.1 * scale, -0.34 * scale);
        root.add(banner);
      }

      // D) Siyavash (Epoch 8): Ring of Sacred Fire flames orbiting around him!
      if (identity === 'siyavash') {
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2;
          const flameTongue = new THREE.Mesh(
            new THREE.ConeGeometry(0.11 * scale, 0.42 * scale, 6),
            new THREE.MeshBasicMaterial({ color: f % 2 === 0 ? 0xf59e0b : 0xea580c })
          );
          flameTongue.position.set(
            Math.cos(ang) * 0.72 * scale,
            1.15 * scale,
            Math.sin(ang) * 0.72 * scale
          );
          root.add(flameTongue);
        }
      }

      // E) Shaghad (Epoch 10): Hollow Plane Tree (`درخت چنار چاه شغاد`) on flank!
      if (identity === 'shaghad') {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28 * scale, 0.38 * scale, 2.5 * scale, 8),
          new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 })
        );
        trunk.position.set(-0.68 * scale, 1.25 * scale, -0.4 * scale);
        root.add(trunk);

        const foliage = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.68 * scale, 0),
          new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 })
        );
        foliage.position.set(-0.68 * scale, 2.65 * scale, -0.4 * scale);
        root.add(foliage);
      }

      // Cape
      const capeGeo = new THREE.PlaneGeometry(0.88 * scale, 1.42 * scale, 4, 6);
      capeGeo.translate(0, -0.71 * scale, 0);
      const capeMat = new THREE.MeshStandardMaterial({
        map: identity === 'keyumars' ? leopardPeltTex : null,
        color:
          identity === 'keyumars'
            ? 0xffffff
            : identity === 'siyavash'
            ? 0xf8fafc
            : identity === 'fereydun'
            ? 0x065f46
            : isGoodFaction
            ? 0x7f1d1d
            : 0x18181b,
        roughness: 0.75,
        side: THREE.DoubleSide,
      });
      const capeMesh = new THREE.Mesh(capeGeo, capeMat);
      capeMesh.position.set(0, 1.84 * scale, -0.3 * scale);
      capeMesh.rotation.x = 0.18;
      root.add(capeMesh);

      const neckStump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12 * scale, 0.14 * scale, 0.14 * scale, 8),
        new THREE.MeshBasicMaterial({ color: 0x7f1d1d })
      );
      neckStump.position.set(0, 1.92 * scale, 0);
      root.add(neckStump);

      // =======================================================================
      // 4. EPOCH-SPECIFIC HEAD, BEARD & CROWN / HELMET
      // =======================================================================
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.12 * scale, 0);

      const isOpenFaceHero =
        identity === 'keyumars' ||
        identity === 'siamak' ||
        identity === 'kaveh' ||
        identity === 'siyavash' ||
        identity === 'sohrab';

      const faceCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19 * scale, 0.2 * scale, 0.34 * scale, 10),
        isOpenFaceHero
          ? skinMat
          : identity === 'esfandiyar'
          ? trimMetalMat
          : new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.65 })
      );
      headGroup.add(faceCore);

      // Slanted Fierce Eyes
      const eyeSlitGeo = new THREE.BoxGeometry(0.072 * scale, 0.022 * scale, 0.03 * scale);
      const eyeSlitMat = new THREE.MeshBasicMaterial({
        color:
          identity === 'div_sepid' || identity === 'sohrab'
            ? 0x38bdf8
            : isGoodFaction
            ? 0xfde68a
            : 0xef4444,
      });
      const leftEyeSlit = new THREE.Mesh(eyeSlitGeo, eyeSlitMat);
      leftEyeSlit.position.set(-0.065 * scale, 0.03 * scale, 0.185 * scale);
      leftEyeSlit.rotation.z = -0.14;
      const rightEyeSlit = new THREE.Mesh(eyeSlitGeo, eyeSlitMat);
      rightEyeSlit.position.set(0.065 * scale, 0.03 * scale, 0.185 * scale);
      rightEyeSlit.rotation.z = 0.14;
      headGroup.add(leftEyeSlit, rightEyeSlit);

      // Facial Hair (Forked Beard for Rostam; Silver Beard for Keyumars; Black Beard for Hushang/Kaveh/Fereydun/Tahmuras; Clean-Shaven for Siamak/Siyavash/Sohrab)
      if (
        identity === 'rostam_mace' ||
        identity === 'rostam_bow' ||
        identity === 'rostam_wounded'
      ) {
        const beardMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
        [-1, 1].forEach((side) => {
          const prong = new THREE.Mesh(
            new THREE.ConeGeometry(0.095 * scale, 0.36 * scale, 6),
            beardMat
          );
          prong.rotation.x = Math.PI;
          prong.rotation.z = side * 0.25;
          prong.position.set(side * 0.075 * scale, -0.18 * scale, 0.11 * scale);
          headGroup.add(prong);
        });
      } else if (
        identity === 'keyumars' ||
        identity === 'hushang' ||
        identity === 'tahmuras' ||
        identity === 'kaveh' ||
        identity === 'fereydun'
      ) {
        const beardMat = new THREE.MeshStandardMaterial({
          color: identity === 'keyumars' ? 0xd1d5db : 0x18181b,
          roughness: 0.85,
        });
        const fullBeard = new THREE.Mesh(
          new THREE.ConeGeometry(0.17 * scale, 0.34 * scale, 8),
          beardMat
        );
        fullBeard.rotation.x = Math.PI;
        fullBeard.position.set(0, -0.16 * scale, 0.1 * scale);
        headGroup.add(fullBeard);
      }

      // Headgear by Character Identity:
      if (identity === 'keyumars') {
        // Leopard-pelt crown & silver mane
        const mane = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.26 * scale, 0),
          new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.85 })
        );
        mane.position.set(0, 0.08 * scale, -0.06 * scale);
        headGroup.add(mane);

        const circlet = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22 * scale, 0.21 * scale, 0.1 * scale, 10),
          trimMetalMat
        );
        circlet.position.set(0, 0.18 * scale, 0);
        headGroup.add(circlet);
      } else if (identity === 'siamak' || identity === 'kaveh') {
        // Headband + Exposed Hair (No helmet!)
        const hairDome = new THREE.Mesh(
          new THREE.SphereGeometry(0.215 * scale, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 })
        );
        hairDome.position.set(0, 0.12 * scale, -0.02 * scale);
        headGroup.add(hairDome);

        const headband = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22 * scale, 0.22 * scale, 0.06 * scale, 12),
          identity === 'kaveh' ? cuirassMat : trimMetalMat
        );
        headband.position.set(0, 0.12 * scale, 0);
        headGroup.add(headband);
      } else if (identity === 'hushang') {
        // Blazing Sadeh Fire Crown!
        const crownBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.23 * scale, 0.21 * scale, 0.14 * scale, 10),
          trimMetalMat
        );
        crownBase.position.set(0, 0.18 * scale, 0);
        headGroup.add(crownBase);

        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const fireSpike = new THREE.Mesh(
            new THREE.ConeGeometry(0.06 * scale, 0.28 * scale, 6),
            new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xf59e0b : 0xea580c })
          );
          fireSpike.position.set(
            Math.cos(a) * 0.16 * scale,
            0.34 * scale,
            Math.sin(a) * 0.16 * scale
          );
          headGroup.add(fireSpike);
        }
      } else if (identity === 'tahmuras' || identity === 'siyavash') {
        // Tall Fluted Persepolis / Kayanian Stepped Crown
        const steppedCrown = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24 * scale, 0.2 * scale, 0.28 * scale, 12),
          trimMetalMat
        );
        steppedCrown.position.set(0, 0.24 * scale, 0);
        headGroup.add(steppedCrown);
      } else {
        // Armored Kulah-Khud Helmet with Nasal Bar
        const helmCone = new THREE.Mesh(
          new THREE.ConeGeometry(0.245 * scale, 0.38 * scale, 8),
          isGoodFaction || identity === 'esfandiyar' || identity === 'sohrab'
            ? trimMetalMat
            : darkSteelMat
        );
        helmCone.position.set(0, 0.24 * scale, 0);
        headGroup.add(helmCone);

        const nasalGuard = new THREE.Mesh(
          new THREE.BoxGeometry(0.035 * scale, 0.22 * scale, 0.05 * scale),
          trimMetalMat
        );
        nasalGuard.position.set(0, 0.01 * scale, 0.21 * scale);
        headGroup.add(nasalGuard);

        if (
          identity === 'rostam_mace' ||
          identity === 'rostam_bow' ||
          identity === 'rostam_wounded'
        ) {
          // Tall Crimson Simurgh Plume on Rostam's Helmet
          const plume = new THREE.Mesh(
            new THREE.ConeGeometry(0.075 * scale, 0.44 * scale, 6),
            new THREE.MeshBasicMaterial({ color: 0xdc2626 })
          );
          plume.position.set(0, 0.52 * scale, -0.05 * scale);
          plume.rotation.x = -0.35;
          headGroup.add(plume);
        } else if (
          identity === 'fereydun' ||
          identity === 'esfandiyar' ||
          identity === 'soroush_angel' ||
          identity === 'farrokhzad'
        ) {
          // Royal Kayanian Winged Helmet Finials
          [-1, 1].forEach((side) => {
            const wing = new THREE.Mesh(
              new THREE.BoxGeometry(0.035 * scale, 0.32 * scale, 0.16 * scale),
              trimMetalMat
            );
            wing.position.set(side * 0.24 * scale, 0.26 * scale, -0.02 * scale);
            wing.rotation.z = -side * 0.48;
            headGroup.add(wing);
          });
        } else if (!isGoodFaction && identity !== 'sohrab') {
          // Demon / Warlord Curved Horns
          [-1, 1].forEach((side) => {
            const horn = new THREE.Mesh(
              new THREE.ConeGeometry(0.072 * scale, 0.46 * scale, 6),
              identity === 'div_sepid'
                ? new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
                : trimMetalMat
            );
            horn.position.set(side * 0.22 * scale, 0.28 * scale, -0.02 * scale);
            horn.rotation.z = -side * 0.62;
            horn.rotation.x = 0.28;
            headGroup.add(horn);
          });
        }
      }

      root.add(headGroup);

      // =======================================================================
      // 5. LEFT ARM (Bow for Rostam in Ep 9/10; Fire Orb for Hushang; Lasso for Tahmuras; Dagger for Siamak; Shield otherwise)
      // =======================================================================
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.56 * scale, 1.76 * scale, 0);

      if (identity !== 'siamak' && identity !== 'kaveh') {
        const leftPauldron = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14 * scale, 0.24 * scale, 0.22 * scale, 6),
          trimMetalMat
        );
        leftPauldron.rotation.z = 0.45;
        leftPauldron.position.set(-0.04 * scale, 0.02 * scale, 0);
        leftArmGroup.add(leftPauldron);
      }

      const upperArmGeo = new THREE.CylinderGeometry(0.11 * scale, 0.095 * scale, 0.56 * scale, 8);
      upperArmGeo.translate(0, -0.28 * scale, 0);
      const leftArmMesh = new THREE.Mesh(
        upperArmGeo,
        identity === 'siamak' || identity === 'kaveh' || identity === 'keyumars'
          ? skinMat
          : darkSteelMat
      );
      leftArmMesh.rotation.x = -0.45;
      leftArmGroup.add(leftArmMesh);

      if (identity === 'rostam_bow' || identity === 'rostam_wounded') {
        // Golden Chachi Bow (`کمان چاچی رستم`)
        const bowArc = new THREE.Mesh(
          new THREE.TorusGeometry(0.55 * scale, 0.035 * scale, 8, 20, Math.PI * 1.15),
          trimMetalMat
        );
        bowArc.position.set(-0.08 * scale, -0.42 * scale, 0.32 * scale);
        bowArc.rotation.y = Math.PI / 2;
        leftArmGroup.add(bowArc);
      } else if (identity === 'hushang') {
        // Blazing Sadeh Fire Stone (`سنگ آتشین سده`) in left hand
        const fireStone = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.2 * scale, 0),
          new THREE.MeshBasicMaterial({ color: 0xf97316 })
        );
        fireStone.position.set(-0.06 * scale, -0.42 * scale, 0.3 * scale);
        leftArmGroup.add(fireStone);
      } else if (identity === 'tahmuras') {
        // Glowing Coiled Golden Kemend (`کمند دیوبند طهمورث`)
        const lassoCoil = new THREE.Mesh(
          new THREE.TorusGeometry(0.28 * scale, 0.04 * scale, 8, 20),
          new THREE.MeshBasicMaterial({ color: 0xfde68a })
        );
        lassoCoil.position.set(-0.08 * scale, -0.42 * scale, 0.28 * scale);
        leftArmGroup.add(lassoCoil);
      } else if (identity !== 'div_siah' && identity !== 'div_sepid') {
        // Round Shield
        const shieldGroup = new THREE.Group();
        shieldGroup.position.set(-0.08 * scale, -0.38 * scale, 0.26 * scale);
        shieldGroup.rotation.y = -0.35;
        shieldGroup.rotation.x = -0.15;

        const shieldDiskGeo = new THREE.CylinderGeometry(
          0.4 * scale,
          0.4 * scale,
          0.045 * scale,
          16
        );
        shieldDiskGeo.rotateX(Math.PI / 2);
        const shieldDisk = new THREE.Mesh(shieldDiskGeo, cuirassMat);
        shieldGroup.add(shieldDisk);

        const shieldRim = new THREE.Mesh(
          new THREE.TorusGeometry(0.4 * scale, 0.028 * scale, 6, 20),
          trimMetalMat
        );
        shieldGroup.add(shieldRim);

        leftArmGroup.add(shieldGroup);
      }

      root.add(leftArmGroup);

      // =======================================================================
      // 6. RIGHT WEAPON ARM (Epoch-Accurate Weapons!)
      // =======================================================================
      const weaponArmGroup = new THREE.Group();
      weaponArmGroup.position.set(0.56 * scale, 1.76 * scale, 0);

      if (identity !== 'siamak' && identity !== 'kaveh') {
        const rightPauldron = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14 * scale, 0.24 * scale, 0.22 * scale, 6),
          trimMetalMat
        );
        rightPauldron.rotation.z = -0.45;
        rightPauldron.position.set(0.04 * scale, 0.02 * scale, 0);
        weaponArmGroup.add(rightPauldron);
      }

      const rightArmMesh = new THREE.Mesh(
        upperArmGeo,
        identity === 'siamak' || identity === 'kaveh' || identity === 'keyumars'
          ? skinMat
          : darkSteelMat
      );
      rightArmMesh.rotation.x = -0.55;
      weaponArmGroup.add(rightArmMesh);

      // Sohrab's Glowing Turquoise Armlet of Tahmineh (`مهره بازوبند سهراب`)
      if (identity === 'sohrab') {
        const armlet = new THREE.Mesh(
          new THREE.TorusGeometry(0.13 * scale, 0.032 * scale, 8, 16),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        armlet.position.set(0, -0.2 * scale, 0.04 * scale);
        armlet.rotation.x = Math.PI / 2;
        weaponArmGroup.add(armlet);
      }

      const weaponGroup = new THREE.Group();
      weaponGroup.position.set(0, -0.42 * scale, 0.28 * scale);

      const shaftGeo = new THREE.CylinderGeometry(0.032 * scale, 0.04 * scale, 1.45 * scale, 8);
      shaftGeo.rotateX(Math.PI / 2);
      const shaft = new THREE.Mesh(shaftGeo, darkSteelMat);
      shaft.position.set(0, 0, 0.45 * scale);
      weaponGroup.add(shaft);

      if (identity === 'kaveh') {
        // Kaveh's Heavy Forged Blacksmith Sledgehammer (`پتک آهنگری کاوه`)
        const hammerHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.48 * scale, 0.24 * scale, 0.26 * scale),
          darkSteelMat
        );
        hammerHead.position.set(0, 0, 1.08 * scale);
        weaponGroup.add(hammerHead);
      } else if (identity === 'hushang') {
        // Hushang's Blazing Sadeh Fire Battle-Axe (`تبر آتشین هوشنگ`)
        const axeBlade = new THREE.Mesh(
          new THREE.ConeGeometry(0.32 * scale, 0.45 * scale, 4),
          new THREE.MeshBasicMaterial({ color: 0xea580c })
        );
        axeBlade.position.set(0, 0.12 * scale, 1.05 * scale);
        weaponGroup.add(axeBlade);
      } else if (identity === 'rostam_bow' || identity === 'rostam_wounded') {
        // Glowing Double-Pronged Tamarisk Arrow-Lance of Simurgh (`تیر گز دوشاخه سیمرغ`)
        const tamariskMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
        [-1, 1].forEach((side) => {
          const prong = new THREE.Mesh(
            new THREE.ConeGeometry(0.045 * scale, 0.42 * scale, 6),
            tamariskMat
          );
          prong.rotation.x = Math.PI / 2;
          prong.rotation.y = side * 0.28;
          prong.position.set(side * 0.09 * scale, 0, 1.18 * scale);
          weaponGroup.add(prong);
        });
      } else if (identity === 'div_sepid') {
        // Div-e Sepid's Giant Circular Stone Millstone (`سنگ آسیاب دیو سفید`)
        const millstone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42 * scale, 0.42 * scale, 0.18 * scale, 14),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 })
        );
        millstone.rotation.z = Math.PI / 2;
        millstone.position.set(0, 0, 1.05 * scale);
        weaponGroup.add(millstone);
      } else if (
        identity === 'siamak' ||
        identity === 'siyavash' ||
        identity === 'sohrab' ||
        identity === 'farrokhzad' ||
        identity === 'afrasiab' ||
        identity === 'shaghad' ||
        role === 'swarmer'
      ) {
        // Forged Persian Shamshir Sword / Royal Lance
        const crossguard = new THREE.Mesh(
          new THREE.BoxGeometry(0.28 * scale, 0.06 * scale, 0.06 * scale),
          trimMetalMat
        );
        crossguard.position.set(0, 0, 0.15 * scale);
        weaponGroup.add(crossguard);

        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.045 * scale, 0.14 * scale, 1.18 * scale),
          bladeSteelMat
        );
        blade.position.set(0, 0, 0.75 * scale);
        weaponGroup.add(blade);
      } else {
        // Bull-Headed Royal Mace (`گرز گاوسار فریدون و رستم`)
        const maceCore = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.21 * scale, 0),
          trimMetalMat
        );
        maceCore.position.set(0, 0, 1.08 * scale);
        weaponGroup.add(maceCore);

        [-1, 1].forEach((side) => {
          const horn = new THREE.Mesh(
            new THREE.ConeGeometry(0.052 * scale, 0.34 * scale, 6),
            bladeSteelMat
          );
          horn.position.set(side * 0.19 * scale, 0, 1.14 * scale);
          horn.rotation.z = -side * 0.72;
          weaponGroup.add(horn);
        });
      }

      weaponArmGroup.add(weaponGroup);
      root.add(weaponArmGroup);

      // Halo Ring
      const haloGeo = new THREE.TorusGeometry(0.54 * scale, 0.022 * scale, 6, 24);
      const haloMat = new THREE.MeshStandardMaterial({
        color: isGoodFaction ? 0xf59e0b : 0x991b1b,
        emissive: isGoodFaction ? 0xb45309 : 0x7f1d1d,
        emissiveIntensity: 0.75,
        roughness: 0.3,
        metalness: 0.9,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(0, 1.72 * scale, -0.26 * scale);
      haloMesh.visible = role === 'player' || role === 'boss';
      root.add(haloMesh);

      const hpBarGeo = new THREE.PlaneGeometry(0.95 * scale, 0.06);
      const hpBarMat = new THREE.MeshBasicMaterial({
        color: isGoodFaction ? 0xf59e0b : 0xdc2626,
        side: THREE.DoubleSide,
      });
      const hpBarMesh = new THREE.Mesh(hpBarGeo, hpBarMat);
      hpBarMesh.position.set(0, 2.68 * scale, 0);
      hpBarMesh.visible = false;
      root.add(hpBarMesh);

      const postureRingGeo = new THREE.RingGeometry(0.66 * scale, 0.76 * scale, 24);
      postureRingGeo.rotateX(-Math.PI / 2);
      const postureRingMat = new THREE.MeshBasicMaterial({
        color: isGoodFaction ? 0x38bdf8 : 0xb45309,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const postureRingMesh = new THREE.Mesh(postureRingGeo, postureRingMat);
      postureRingMesh.position.y = 0.03;
      root.add(postureRingMesh);

      return {
        root,
        group: root,
        headGroup,
        leftLegGroup,
        rightLegGroup,
        leftArmGroup,
        weaponPivot: weaponArmGroup,
        weaponArmGroup,
        capeMesh,
        haloMesh,
        hpBarMesh,
        postureRingMesh,
      };
    };

    let heroModel = buildStoryCharacterRig({
      scale: 1.02,
      isGoodFaction: runStateRef.current.alignment >= 0,
      epochIdx: runStateRef.current.epochIndex,
      role: 'player',
    });
    scene.add(heroModel.root);

    // 4 Corner Sadeh Fire Braziers
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

    const pedestalGeo = new THREE.CylinderGeometry(0.85, 1.15, 1.3, 8);
    pedestalGeo.translate(0, 0.65, 0);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.85,
      metalness: 0.3,
    });
    const flameGeo = new THREE.ConeGeometry(0.62, 1.65, 8);
    flameGeo.translate(0, 1.85, 0);

    brazierCoords.forEach((coord) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(coord.x, 0, coord.z);
      const ped = new THREE.Mesh(pedestalGeo, pedestalMat);
      bGroup.add(ped);

      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xea580c,
        transparent: true,
        opacity: 0.0,
      });
      const flameMesh = new THREE.Mesh(flameGeo, flameMat);
      bGroup.add(flameMesh);

      const light = new THREE.PointLight(0xf97316, 0, 15, 2);
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
    // DIRECTIONAL ARTERIAL BLOOD PHYSICS & FLOOR SPLATTER DECALS
    // =========================================================================
    const arterialDrops: ArterialDrop3D[] = [];
    const severedGibs: SeveredGib3D[] = [];
    const bloodPools: BloodPoolDecal3D[] = [];
    const projectiles: Projectile3D[] = [];
    const enemies: Enemy3DEntity[] = [];

    const dropGeo = new THREE.SphereGeometry(0.028, 6, 6);
    const bloodPoolGeo = new THREE.PlaneGeometry(1.35, 1.35);
    bloodPoolGeo.rotateX(-Math.PI / 2);

    const createBloodSplatterTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 256);

      const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 92);
      grad.addColorStop(0, 'rgba(38, 4, 4, 0.92)');
      grad.addColorStop(0.5, 'rgba(98, 11, 11, 0.84)');
      grad.addColorStop(0.8, 'rgba(136, 19, 19, 0.45)');
      grad.addColorStop(1, 'rgba(127, 29, 29, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(128, 128, 92, 0, Math.PI * 2);
      ctx.fill();

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
      const coneSpread = isFatalGore ? 1.15 : 0.72;

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
      enemy.headGroup.visible = false;
      enemy.weaponArmGroup.visible = false;
      enemy.hpBarMesh.visible = false;
      enemy.postureRingMesh.visible = false;
      enemy.group.position.set(enemy.x, 0.34, enemy.z);
      enemy.group.rotation.set(Math.PI / 2, enemy.group.rotation.y, 0.2);

      if (!settingsRef.current.dismembermentEnabled || settingsRef.current.goreIntensityMultiplier <= 0.2) {
        return;
      }

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

    let playerX = -2.0;
    let playerZ = 0.2;
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
    const vanguardKillsBeforeBossCrossroads = 4;
    let crossroadsPromptedForEpoch = false;
    let isDuelBossFight = false;
    let currentEpochTracked = runStateRef.current.epochIndex;
    let currentAlignmentTracked = runStateRef.current.alignment;

    const keysDown = new Set<string>();

    const rebuildHeroMeshForEpoch = () => {
      scene.remove(heroModel.root);
      const epochIdx = runStateRef.current.epochIndex;
      const isPlayerGood = runStateRef.current.alignment >= 0;
      heroModel = buildStoryCharacterRig({
        scale: 1.02,
        isGoodFaction: isPlayerGood,
        epochIdx,
        role: 'player',
      });
      heroModel.root.position.set(playerX, 0, playerZ);
      scene.add(heroModel.root);
    };

    const spawnEnemy3D = (archetype: EnemyArchetype, x: number, z: number) => {
      const isBoss = archetype === 'div_siah_boss';
      const epochIdx = runStateRef.current.epochIndex;
      const isFa = settingsRef.current.language !== 'en';
      const isEvilPlayer = runStateRef.current.alignment < 0;

      // FACTION INVERSION:
      // If Player chose Evil (isEvilPlayer === true), Enemies & Bosses are Forces of GOOD!
      const enemyIsGoodFaction = isEvilPlayer;

      const built = buildStoryCharacterRig({
        scale: isBoss ? 1.24 : archetype === 'poulad_charger' ? 1.06 : 0.95,
        isGoodFaction: enemyIsGoodFaction,
        epochIdx,
        role: isBoss
          ? 'boss'
          : archetype === 'poulad_charger'
          ? 'charger'
          : archetype === 'jadu_kiter'
          ? 'kiter'
          : 'swarmer',
      });
      built.group.position.set(x, 0, z);
      scene.add(built.group);

      const diffScale = settingsRef.current.enemyAggressionScale;
      const maxHp = isBoss
        ? Math.round(280 * diffScale)
        : archetype === 'poulad_charger'
        ? Math.round(90 * diffScale)
        : Math.round(62 * diffScale);

      enemies.push({
        id: nextEnemyId++,
        archetype,
        name: isBoss
          ? getEpochBossTitle(epochIdx, isFa, isEvilPlayer)
          : getMinionName(archetype, epochIdx, isFa, isEvilPlayer),
        x,
        z,
        vx: 0,
        vz: 0,
        hp: maxHp,
        maxHp,
        posture: 0,
        maxPosture: isBoss ? 150 : 75,
        radius: isBoss ? 1.55 : 1.05,
        speed: (isBoss ? 4.6 : archetype === 'gurg_swarmer' ? 5.9 : 4.6) * diffScale,
        damage: Math.round((isBoss ? 22 : 13) * diffScale),
        state: 'seeking',
        stateTimer: 0,
        telegraphDuration: isBoss ? 0.62 : 0.55,
        attackCooldown: 0.75,
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

    const rebuildAllEnemiesForFaction = () => {
      const savedPositions = enemies
        .filter((e) => e.state !== 'ko')
        .map((e) => ({
          archetype: e.archetype,
          x: e.x,
          z: e.z,
          hpRatio: e.hp / Math.max(1, e.maxHp),
        }));
      enemies.forEach((e) => scene.remove(e.group));
      enemies.length = 0;

      savedPositions.forEach((pos) => {
        spawnEnemy3D(pos.archetype, pos.x, pos.z);
        const newest = enemies[enemies.length - 1];
        if (newest) {
          newest.hp = Math.max(1, Math.round(newest.maxHp * pos.hpRatio));
        }
      });
    };

    const enterOneOnOneBossDuel = () => {
      currentEpochTracked = runStateRef.current.epochIndex;
      currentAlignmentTracked = runStateRef.current.alignment;

      enemies.forEach((e) => scene.remove(e.group));
      enemies.length = 0;
      projectiles.forEach((p) => scene.remove(p.mesh));
      projectiles.length = 0;

      isDuelBossFight = true;
      crossroadsPromptedForEpoch = true;
      playerX = -2.2;
      playerZ = 0.0;
      facingAngle = Math.PI / 2;

      rebuildHeroMeshForEpoch();

      braziers3D.forEach((b) => {
        b.ignited = true;
        (b.flameMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
        b.light.intensity = 3.8;
      });
      duelRingMat.color.setHex(
        runStateRef.current.alignment < 0 ? 0x991b1b : 0xb45309
      );
      duelRingMat.opacity = 0.75;

      spawnEnemy3D('div_siah_boss', 2.2, 0.0);
    };

    const resetWaveForEpoch = () => {
      enemies.forEach((e) => scene.remove(e.group));
      enemies.length = 0;
      projectiles.forEach((p) => scene.remove(p.mesh));
      projectiles.length = 0;
      bloodPools.forEach((b) => scene.remove(b.mesh));
      bloodPools.length = 0;
      killsInEpoch = 0;
      crossroadsPromptedForEpoch = false;
      isDuelBossFight = false;
      duelRingMat.opacity = 0.0;
      playerX = -2.0;
      playerZ = 0.2;
      facingAngle = Math.PI / 2;

      rebuildHeroMeshForEpoch();

      braziers3D.forEach((b) => {
        const startLit = b.z < 0;
        b.ignited = startLit;
        (b.flameMesh.material as THREE.MeshBasicMaterial).opacity = startLit ? 0.92 : 0;
        b.light.intensity = startLit ? 3.4 : 0;
      });

      spawnBloodPool(0.8, 0.2, 0.48, 0.4);
      spawnBloodPool(2.0, -0.8, 0.42, 1.2);

      spawnEnemy3D('gurg_swarmer', 1.2, 0.3);
      spawnEnemy3D('poulad_charger', 2.4, -1.1);
      spawnEnemy3D('jadu_kiter', 3.0, 0.6);
    };

    resetWaveForEpoch();

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

      const reach = isHeavyMythic ? 6.2 : 4.2;
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
          const maxArenaR = isDuelBossFight ? 5.2 : 16.5;
          enemy.x = Math.max(-maxArenaR, Math.min(maxArenaR, enemy.x + dirX * 1.15));
          enemy.z = Math.max(-maxArenaR, Math.min(maxArenaR, enemy.z + dirZ * 1.15));

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
              score: prev.score + (enemy.archetype === 'div_siah_boss' ? 400 : 100),
              enemiesVanquished: prev.enemiesVanquished + 1,
            }));

            if (isDuelBossFight && enemy.archetype === 'div_siah_boss') {
              setTimeout(() => {
                if (!isDisposed) callbacksRef.current.onEpochWaveCleared();
              }, 900);
            }
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
            if (isDuelBossFight && enemy.archetype === 'div_siah_boss') {
              setTimeout(() => {
                if (!isDisposed) callbacksRef.current.onEpochWaveCleared();
              }, 900);
            }
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

      if (isDuelBossFight && target.archetype === 'div_siah_boss') {
        setTimeout(() => {
          if (!isDisposed) callbacksRef.current.onEpochWaveCleared();
        }, 900);
      }
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

    const handleEnterDuelBossFightEvent = () => {
      enterOneOnOneBossDuel();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('shahnameh-trigger-gore-burst', handleGoreBurstEvent);
    window.addEventListener('shahnameh-enter-duel-boss-fight', handleEnterDuelBossFightEvent);

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
      } else if (currentAlignmentTracked !== runStateRef.current.alignment) {
        const prevWasEvil = currentAlignmentTracked < 0;
        const nextIsEvil = runStateRef.current.alignment < 0;
        currentAlignmentTracked = runStateRef.current.alignment;
        rebuildHeroMeshForEpoch();
        if (prevWasEvil !== nextIsEvil) {
          rebuildAllEnemiesForFaction();
        }
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
            const maxX = isDuelBossFight ? 4.8 : 14.5;
            const maxZ = isDuelBossFight ? 4.8 : 9.5;
            playerX = Math.max(-maxX, Math.min(maxX, playerX + mx * speed * dt));
            playerZ = Math.max(-maxZ, Math.min(maxZ, playerZ + mz * speed * dt));
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
          heroModel.capeMesh.rotation.x =
            0.18 + (moveLen > 0.01 ? 0.25 + Math.abs(strideSwing) * 0.2 : 0);

          heroModel.weaponPivot.rotation.x =
            attackAnimTimer > 0
              ? -Math.sin((1 - attackAnimTimer / 0.36) * Math.PI) * 1.65
              : strideSwing * 0.3;
          heroModel.haloMesh.rotation.z = elapsed * 0.8;

          const activeEnemies = enemies.filter((e) => e.state !== 'ko');

          if (!isDuelBossFight) {
            if (
              gameStateRef.current === 'playing' &&
              killsInEpoch >= vanguardKillsBeforeBossCrossroads &&
              !crossroadsPromptedForEpoch
            ) {
              crossroadsPromptedForEpoch = true;
              if (callbacksRef.current.onRequestGoodEvilCrossroads) {
                callbacksRef.current.onRequestGoodEvilCrossroads();
              } else {
                enterOneOnOneBossDuel();
              }
            } else if (
              activeEnemies.length < 3 &&
              (killsInEpoch < vanguardKillsBeforeBossCrossroads ||
                gameStateRef.current === 'title')
            ) {
              const types: EnemyArchetype[] = ['gurg_swarmer', 'poulad_charger', 'jadu_kiter'];
              const pick = types[(killsInEpoch + activeEnemies.length) % types.length];
              const side = (killsInEpoch + activeEnemies.length) % 2 === 0 ? 4.0 : -4.0;
              spawnEnemy3D(pick, side, (Math.random() - 0.5) * 3.4);
            }
          } else {
            duelRingMesh.rotation.y = elapsed * 0.5;
            duelRingMat.opacity = 0.65 + Math.sin(elapsed * 5) * 0.15;
          }

          let tokenAvailable = true;
          const isEvilPlayer = runStateRef.current.alignment < 0;
          const isFa = settingsRef.current.language !== 'en';
          const epochIdx = runStateRef.current.epochIndex;

          activeEnemies.forEach((enemy) => {
            if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer -= dt;
            if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

            enemy.name =
              enemy.archetype === 'div_siah_boss'
                ? getEpochBossTitle(epochIdx, isFa, isEvilPlayer)
                : getMinionName(enemy.archetype, epochIdx, isFa, isEvilPlayer);

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
                  const orbGeo = new THREE.SphereGeometry(0.22, 10, 10);
                  const orbMat = new THREE.MeshBasicMaterial({
                    color: isEvilPlayer ? 0xf59e0b : 0x9333ea,
                  });
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
              const maxArenaR = isDuelBossFight ? 4.9 : 16.5;
              enemy.x = Math.max(-maxArenaR, Math.min(maxArenaR, enemy.x + stepX));
              enemy.z = Math.max(-maxArenaR, Math.min(maxArenaR, enemy.z + stepZ));
              isMoving = Math.hypot(stepX, stepZ) > 0.002;
              if (policy.shouldStartTelegraph) {
                tokenAvailable = false;
                enemy.state = 'telegraph';
                enemy.stateTimer = enemy.telegraphDuration;
                soundEngine.playTelegraphWarning();
              }
            }

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
            enemy.hpBarMesh.visible =
              enemy.archetype !== 'div_siah_boss' && enemy.hp < enemy.maxHp;
            enemy.hpBarMesh.scale.x = Math.max(0.05, enemy.hp / enemy.maxHp);
            enemy.hpBarMesh.lookAt(camera.position);
          });

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

      for (let i = arterialDrops.length - 1; i >= 0; i--) {
        const drop = arterialDrops[i];
        drop.vy -= 34 * dt;
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;
        drop.z += drop.vz * dt;
        drop.life -= dt;

        drop.mesh.position.set(drop.x, drop.y, drop.z);
        _lookTarget.set(drop.x + drop.vx, drop.y + drop.vy, drop.z + drop.vz);
        drop.mesh.lookAt(_lookTarget);

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

      bloodPools.forEach((pool) => {
        pool.scale = THREE.MathUtils.damp(pool.scale, pool.targetScale, 6, dt);
        pool.mesh.scale.setScalar(pool.scale);
      });

      braziers3D.forEach((b, idx) => {
        if (b.ignited) {
          b.flameMesh.scale.y = 0.9 + Math.sin(elapsed * 9 + idx) * 0.2;
          b.light.intensity = 3.2 + Math.sin(elapsed * 11 + idx) * 0.6;
        }
      });

      if (cameraShake > 0) cameraShake = Math.max(0, cameraShake - dt * 2.6);
      const shakeX = (Math.random() - 0.5) * cameraShake;
      const shakeZ = (Math.random() - 0.5) * cameraShake;

      const aspectScale =
        camera.aspect < 1.1 ? Math.min(1.68, 1.08 / Math.max(0.44, camera.aspect)) : 1.0;
      const targetCamY = (isDuelBossFight ? 7.8 : 10.6) * aspectScale;
      const targetCamZ =
        (isDuelBossFight ? 8.8 + playerZ * 0.2 : 12.0 + playerZ * 0.25) * aspectScale;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, playerX * 0.25 + shakeX, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 4, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ + shakeZ, 5, dt);
      camera.lookAt(playerX * 0.15, 1.15, playerZ * 0.15);

      const activeEnemies = enemies.filter((e) => e.state !== 'ko');
      const boss = activeEnemies.find((e) => e.archetype === 'div_siah_boss');
      const isFa = settingsRef.current.language !== 'en';
      const isEvilPlayer = runStateRef.current.alignment < 0;
      const localizedBossName = getEpochBossTitle(
        runStateRef.current.epochIndex,
        isFa,
        isEvilPlayer
      );
      if (boss) boss.name = localizedBossName;

      callbacksRef.current.onSyncTelemetry({
        hp: runStateRef.current.hp,
        maxHp: runStateRef.current.maxHp,
        trailingHp: runStateRef.current.hp,
        mythicEnergy: runStateRef.current.mythicEnergy,
        waveProgress: isDuelBossFight
          ? 100
          : Math.min(100, Math.round((killsInEpoch / vanguardKillsBeforeBossCrossroads) * 100)),
        bossActive: !!boss,
        bossName: localizedBossName,
        bossHp: boss ? boss.hp : 0,
        bossMaxHp: boss ? boss.maxHp : 100,
        activeEnemyCount: activeEnemies.length,
        boundEnemiesCount: activeEnemies.filter((e) => e.state === 'bound').length,
        braziersLit: braziers3D.filter((b) => b.ignited).length,
        flintReady: flintCooldown <= 0,
        isDuelBossFight,
        heroTitle: getEpochHeroTitle(runStateRef.current.epochIndex, isFa, isEvilPlayer),
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
      camera.aspect = Math.max(0.25, w / Math.max(1, h));
      camera.updateProjectionMatrix();
      if (!isSoftwareGl) {
        const isSmallScreen = w < 768;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1.5 : 2));
      }
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    if (resizeObserver && container) {
      resizeObserver.observe(container);
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('shahnameh-trigger-gore-burst', handleGoreBurstEvent);
      window.removeEventListener('shahnameh-enter-duel-boss-fight', handleEnterDuelBossFightEvent);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-[#070504]"
    />
  );
};
