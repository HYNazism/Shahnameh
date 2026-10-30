import React, { useEffect, useRef } from 'react';
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

export interface LiveCombatTelemetry {
  hp: number;
  maxHp: number;
  trailingHp: number;
  mythicEnergy: number;
  waveProgress: number;
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  activeEnemyCount: number;
  boundEnemiesCount: number;
  braziersLit: number;
  flintReady: boolean;
}

interface GameCanvasProps {
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

interface EnemyEntity {
  id: number;
  archetype: EnemyArchetype;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
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
  targetX: number;
  targetY: number;
  hitFlashTimer: number;
  koTimer: number;
  phaseTimer: number;
  facing: number;
  hasToken: boolean;
}

interface ProjectileEntity {
  active: boolean;
  fromPlayer: boolean;
  isFlintStone: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  postureDamage: number;
  life: number;
  color: string;
}

interface HazardZone {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  damage: number;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const PARTICLE_POOL_SIZE = 256;
const PROJECTILE_POOL_SIZE = 48;
const HAZARD_POOL_SIZE = 12;
const MAX_ATTACK_TOKENS = 3;

export const GameCanvas: React.FC<GameCanvasProps> = ({
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const propsRef = useRef({
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
  });

  useEffect(() => {
    propsRef.current = {
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
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let viewWidth = container.clientWidth || 1440;
    let viewHeight = container.clientHeight || 900;
    let canvasRect = canvas.getBoundingClientRect();

    const updateCanvasSize = () => {
      if (!container || !canvas) return;
      viewWidth = Math.max(320, container.clientWidth);
      viewHeight = Math.max(320, container.clientHeight);
      canvas.width = viewWidth;
      canvas.height = viewHeight;
      canvasRect = canvas.getBoundingClientRect();
    };
    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(container);

    const keysHeld = new Set<string>();
    const keysJustPressed = new Set<string>();
    let mouseWorldX = viewWidth * 0.65;
    let mouseWorldY = viewHeight * 0.55;
    let mouseDown = false;

    const screenToWorld = (clientX: number, clientY: number) => {
      canvasRect = canvas.getBoundingClientRect();
      return {
        x: clientX - canvasRect.left,
        y: clientY - canvasRect.top,
      };
    };

    const clearInputs = () => {
      keysHeld.clear();
      keysJustPressed.clear();
      mouseDown = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (!keysHeld.has(code)) {
        keysJustPressed.add(code);
      }
      keysHeld.add(code);

      const p = propsRef.current;
      if (code === 'KeyM') {
        p.onToggleMute();
      } else if (code === 'KeyO') {
        e.preventDefault();
        p.onOpenSettings();
      } else if (code === 'KeyR' && p.gameState === 'playing' && !p.isModalOpen) {
        p.onQuickRestart();
      } else if ((code === 'Escape' || code === 'KeyP') && !p.isModalOpen) {
        if (p.gameState === 'playing' || p.gameState === 'paused') {
          e.preventDefault();
          p.onTriggerPause();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    const onMouseMove = (e: MouseEvent) => {
      const pt = screenToWorld(e.clientX, e.clientY);
      mouseWorldX = pt.x;
      mouseWorldY = pt.y;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseDown = true;
        keysJustPressed.add('MouseLeft');
      } else if (e.button === 2) {
        keysJustPressed.add('MouseRight');
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseDown = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (propsRef.current.gameState === 'playing') {
        e.preventDefault();
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) clearInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', onVisibilityChange);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    // Zero-GC Pre-allocated Particle Ring Buffer
    const particles: PooledParticle[] = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 3,
      color: '#FDE68A',
      alpha: 1,
      life: 0,
      maxLife: 0.5,
    }));
    let particleCursor = 0;

    const spawnParticles = (
      x: number,
      y: number,
      baseCount: number,
      color: string,
      speedMin: number,
      speedMax: number,
      sizeMin = 2,
      sizeMax = 5,
      life = 0.45
    ) => {
      const mult = propsRef.current.settings.particleDensityMultiplier;
      const count = Math.max(1, Math.round(baseCount * mult));
      for (let i = 0; i < count; i++) {
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_POOL_SIZE;
        const angle = Math.random() * Math.PI * 2;
        const spd = speedMin + Math.random() * (speedMax - speedMin);
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        p.size = sizeMin + Math.random() * (sizeMax - sizeMin);
        p.color = color;
        p.alpha = 1;
        p.life = life * (0.7 + Math.random() * 0.5);
        p.maxLife = p.life;
      }
    };

    const projectiles: ProjectileEntity[] = Array.from({ length: PROJECTILE_POOL_SIZE }, () => ({
      active: false,
      fromPlayer: false,
      isFlintStone: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 7,
      damage: 12,
      postureDamage: 15,
      life: 0,
      color: '#EF4444',
    }));

    const spawnProjectile = (
      fromPlayer: boolean,
      isFlintStone: boolean,
      x: number,
      y: number,
      vx: number,
      vy: number,
      damage: number,
      postureDamage: number,
      color: string,
      radius = 7
    ) => {
      const slot = projectiles.find((pr) => !pr.active);
      if (!slot) return;
      slot.active = true;
      slot.fromPlayer = fromPlayer;
      slot.isFlintStone = isFlintStone;
      slot.x = x;
      slot.y = y;
      slot.vx = vx;
      slot.vy = vy;
      slot.damage = damage;
      slot.postureDamage = postureDamage;
      slot.color = color;
      slot.radius = radius;
      slot.life = 2.4;
    };

    const hazards: HazardZone[] = Array.from({ length: HAZARD_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      radius: 56,
      timer: 0,
      maxTimer: 0.75,
      damage: 22,
    }));

    const spawnHazard = (x: number, y: number, radius = 58, duration = 0.75, damage = 22) => {
      const slot = hazards.find((h) => !h.active);
      if (!slot) return;
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.radius = radius;
      slot.timer = duration;
      slot.maxTimer = duration;
      slot.damage = damage;
    };

    // 4 Interactive Corner Sadeh Fire Braziers
    const braziersState = [false, false, false, false];

    const getBrazierCoords = () => {
      const floorTop = Math.max(215, Math.floor(viewHeight * 0.31));
      const floorBottom = viewHeight - 54;
      const floorLeft = 48;
      const floorRight = viewWidth - 48;
      return [
        { x: floorLeft + 48, y: floorTop + 48 },
        { x: floorRight - 48, y: floorTop + 48 },
        { x: floorLeft + 48, y: floorBottom - 48 },
        { x: floorRight - 48, y: floorBottom - 48 },
      ];
    };

    const player = {
      x: Math.max(260, viewWidth * 0.28),
      y: viewHeight * 0.62,
      vx: 0,
      vy: 0,
      facingAngle: 0,
      walkDistance: 0,
      scaleX: 1,
      scaleY: 1,
      dashTimer: 0,
      dashCooldown: 0,
      dashBufferTimer: 0,
      invulnTimer: 0,
      hitFlashTimer: 0,
      attackPhase: 'idle' as 'idle' | 'windup' | 'active' | 'recovery',
      attackPhaseTimer: 0,
      attackBufferTimer: 0,
      attackAngle: 0,
      attackHitIds: new Set<number>(),
      flintCooldown: 0,
      flintShieldTimer: 0,
      novaVisualTimer: 0,
      novaIsAsha: true,
    };

    let trailingHp = 100;
    let hitstopTimer = 0;
    let cameraTrauma = 0;
    let titlePanTime = 0;
    let activeEpochTracked = -1;
    let epochKills = 0;
    let epochTargetKills = 7;
    let spawnTimer = 1.2;
    let nextEnemyId = 1;
    let bossSpawnedInEpoch = false;
    let defeatDelayTimer = 0;
    let lastTelemetryPush = 0;

    const enemies: EnemyEntity[] = [];

    const resetArenaForEpoch = (epochIdx: number) => {
      activeEpochTracked = epochIdx;
      epochKills = 0;
      epochTargetKills = epochIdx === 0 ? 6 : epochIdx === 1 ? 7 : 8;
      bossSpawnedInEpoch = false;
      spawnTimer = 0.9;
      defeatDelayTimer = 0;
      enemies.length = 0;
      projectiles.forEach((pr) => (pr.active = false));
      hazards.forEach((h) => (h.active = false));

      // In Era of Hushang (Epoch >= 2), 1 Sadeh Brazier starts lit as the First Spark!
      braziersState[0] = epochIdx >= 2;
      braziersState[1] = false;
      braziersState[2] = false;
      braziersState[3] = false;

      const initialLitCount = braziersState.filter(Boolean).length;
      propsRef.current.onSyncRunState((prev) => ({
        ...prev,
        braziersLit: initialLitCount,
      }));

      player.x = Math.max(240, viewWidth * 0.26);
      player.y = viewHeight * 0.62;
      player.vx = 0;
      player.vy = 0;
      player.scaleX = 1;
      player.scaleY = 1;
      player.attackPhase = 'idle';
      player.invulnTimer = 1.0;

      spawnEnemyForEpoch(epochIdx, false);
      spawnEnemyForEpoch(epochIdx, false);
    };

    const spawnEnemyForEpoch = (epochIdx: number, isBoss: boolean) => {
      const courtyardTop = Math.max(215, Math.floor(viewHeight * 0.31)) + 36;
      const courtyardBottom = viewHeight - 90;
      const spawnX = viewWidth - 110 - Math.random() * 90;
      const spawnY =
        courtyardTop + Math.random() * Math.max(120, courtyardBottom - courtyardTop);

      const aggr = propsRef.current.settings.enemyAggressionScale;

      let archetype: EnemyArchetype = 'gurg_swarmer';
      let name = 'گرگ‌دیو (Gurg-Div)';
      let hp = Math.round((48 + epochIdx * 12) * aggr);
      let maxPosture = 60;
      let radius = 20;
      let speed = (130 + epochIdx * 8) * aggr;
      let damage = Math.round((13 + epochIdx * 3) * aggr);
      let telegraphDuration = Math.max(0.32, 0.45 / Math.sqrt(aggr));

      if (isBoss) {
        archetype = 'div_siah_boss';
        name =
          epochIdx === 0
            ? 'طلایه‌دار خردیو (Khar-Div)'
            : epochIdx === 1
            ? 'سالار پولاددیو (Poulad-Div)'
            : epochIdx === 2
            ? 'دیو سیاه (Div-e Siah)'
            : epochIdx === 3
            ? 'ارغون غول بیابان (Ghul Archon)'
            : 'سردار ماردوش ضحاک (Biwarasp General)';
        hp = Math.round((190 + epochIdx * 65) * aggr);
        maxPosture = 130;
        radius = 34;
        speed = (108 + epochIdx * 7) * aggr;
        damage = Math.round((22 + epochIdx * 4) * aggr);
        telegraphDuration = 0.72;
      } else {
        const roll = Math.random();
        if (roll < 0.4) {
          archetype = 'gurg_swarmer';
          name = 'گرگ‌دیو (Gurg-Div)';
          maxPosture = 50;
        } else if (roll < 0.72) {
          archetype = 'jadu_kiter';
          name = 'جادوگر مازندران (Jadu-Div)';
          hp = Math.round((40 + epochIdx * 10) * aggr);
          maxPosture = 55;
          radius = 19;
          speed = 115 * aggr;
          damage = Math.round((14 + epochIdx * 3) * aggr);
          telegraphDuration = 0.55;
        } else {
          archetype = 'poulad_charger';
          name = 'پولاددیو زرهپوش (Poulad-Div)';
          hp = Math.round((72 + epochIdx * 16) * aggr);
          maxPosture = 85;
          radius = 25;
          speed = 118 * aggr;
          damage = Math.round((19 + epochIdx * 4) * aggr);
          telegraphDuration = 0.65;
        }
      }

      enemies.push({
        id: nextEnemyId++,
        archetype,
        name,
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        hp,
        maxHp: hp,
        posture: 0,
        maxPosture,
        radius,
        speed,
        damage,
        state: 'seeking',
        stateTimer: 0,
        telegraphDuration,
        attackCooldown: 0.9 + Math.random() * 0.6,
        targetX: player.x,
        targetY: player.y,
        hitFlashTimer: 0,
        koTimer: 0,
        phaseTimer: Math.random() * 6,
        facing: -1,
        hasToken: false,
      });

      spawnParticles(spawnX, spawnY, 8, '#DC2626', 30, 90, 2, 5, 0.4);
    };

    const drawPersianMiniatureWorld = (panOffset: number, epochIdx: number) => {
      const ornamentLevel = propsRef.current.settings.miniatureOrnamentLevel;

      // 1. Lapis Lazuli, Crimson Sadeh, or Zahhak Twilight Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, viewHeight);
      if (epochIdx === 0) {
        skyGrad.addColorStop(0, '#091126');
        skyGrad.addColorStop(0.55, '#132042');
        skyGrad.addColorStop(1, '#1C130E');
      } else if (epochIdx === 1) {
        skyGrad.addColorStop(0, '#14090D');
        skyGrad.addColorStop(0.55, '#261019');
        skyGrad.addColorStop(1, '#17100E');
      } else if (epochIdx === 2) {
        // Era of Hushang & Sadeh Fire: Deep Lapis & Glowing Sadeh Amber Horizon
        skyGrad.addColorStop(0, '#0F172A');
        skyGrad.addColorStop(0.5, '#3B110B');
        skyGrad.addColorStop(1, '#1A0F0A');
      } else {
        skyGrad.addColorStop(0, '#1A0808');
        skyGrad.addColorStop(0.5, '#2D120B');
        skyGrad.addColorStop(1, '#140E0B');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      // 2. Stars & Swirling Clouds (scaled by ornamentLevel 1..4)
      if (ornamentLevel >= 2) {
        ctx.save();
        ctx.fillStyle = '#FDE68A';
        const starCount = ornamentLevel * 8;
        for (let i = 0; i < starCount; i++) {
          const sx = ((i * 173 + panOffset * 12) % (viewWidth - 40)) + 20;
          const sy = 28 + ((i * 61) % Math.floor(viewHeight * 0.26));
          ctx.globalAlpha = 0.25 + 0.35 * Math.sin(titlePanTime * 2 + i);
          ctx.beginPath();
          ctx.arc(sx, sy, i % 4 === 0 ? 2.2 : 1.3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (ornamentLevel >= 4) {
          ctx.globalAlpha = 0.38;
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          for (let c = 0; c < 3; c++) {
            const cx = viewWidth * 0.45 + c * 210 - ((panOffset * 20) % 160);
            const cy = 68 + c * 34;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.bezierCurveTo(cx + 35, cy - 18, cx + 75, cy + 14, cx + 115, cy - 6);
            ctx.bezierCurveTo(cx + 140, cy - 18, cx + 165, cy + 8, cx + 190, cy);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // 3. Mount Alborz Stylized Mineral Crags & Cypress Trees
      if (ornamentLevel >= 3) {
        ctx.save();
        ctx.fillStyle = epochIdx === 2 ? '#29150E' : '#1E1B2E';
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, viewHeight * 0.32);
        ctx.lineTo(viewWidth * 0.35, viewHeight * 0.31);
        ctx.lineTo(viewWidth * 0.52, viewHeight * 0.19);
        ctx.lineTo(viewWidth * 0.68, viewHeight * 0.25);
        ctx.lineTo(viewWidth * 0.84, viewHeight * 0.13);
        ctx.lineTo(viewWidth, viewHeight * 0.24);
        ctx.lineTo(viewWidth, viewHeight * 0.36);
        ctx.lineTo(0, viewHeight * 0.36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const cypressPositions = [0.46, 0.62, 0.78, 0.91];
        cypressPositions.forEach((ratio, idx) => {
          const tx = viewWidth * ratio;
          const ty = viewHeight * 0.33;
          const sway = Math.sin(titlePanTime * 1.6 + idx) * 3;
          ctx.fillStyle = '#0D261C';
          ctx.strokeStyle = '#B45309';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx - 14, ty - 34, tx + sway, ty - 72);
          ctx.quadraticCurveTo(tx + 14, ty - 34, tx, ty);
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();
      }

      // 4. Playable Miniature Terrace Courtyard Floor
      const floorTop = Math.max(215, Math.floor(viewHeight * 0.31));
      const floorBottom = viewHeight - 54;
      const floorLeft = 48;
      const floorRight = viewWidth - 48;

      const floorGrad = ctx.createLinearGradient(0, floorTop, 0, floorBottom);
      floorGrad.addColorStop(0, '#1B1512');
      floorGrad.addColorStop(0.5, '#231A15');
      floorGrad.addColorStop(1, '#140F0C');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(floorLeft, floorTop, floorRight - floorLeft, floorBottom - floorTop);

      ctx.save();
      if (ornamentLevel >= 2) {
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.13)';
        ctx.lineWidth = 1;
        const gridStep = 90;
        for (let gx = floorLeft + gridStep; gx < floorRight; gx += gridStep) {
          ctx.beginPath();
          ctx.moveTo(gx, floorTop);
          ctx.lineTo(gx, floorBottom);
          ctx.stroke();
        }
        for (let gy = floorTop + gridStep; gy < floorBottom; gy += gridStep) {
          ctx.beginPath();
          ctx.moveTo(floorLeft, gy);
          ctx.lineTo(floorRight, gy);
          ctx.stroke();
        }
      }

      if (ornamentLevel >= 3) {
        const centerX = viewWidth * 0.5;
        const centerY = (floorTop + floorBottom) * 0.5;
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.26)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 105, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 68, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4 Interactive Sadeh Fire Braziers at the terrace corners
      const braziers = getBrazierCoords();
      braziers.forEach((b, i) => {
        const isLit = braziersState[i] || propsRef.current.gameState === 'title';
        ctx.fillStyle = isLit ? '#451A03' : '#1C1917';
        ctx.strokeStyle = isLit ? '#FDE68A' : '#78716C';
        ctx.lineWidth = isLit ? 2.2 : 1.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isLit) {
          // Radiant Sadeh Forge Aura Ring
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 38, 0, Math.PI * 2);
          ctx.stroke();

          const flicker = 9 + Math.sin(titlePanTime * 7 + i * 2) * 2.8;
          ctx.fillStyle = '#DC2626';
          ctx.beginPath();
          ctx.arc(b.x, b.y, flicker, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FDE68A';
          ctx.beginPath();
          ctx.arc(b.x, b.y, flicker * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Outer Miniature Manuscript Double Rule Frame
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(floorLeft, floorTop, floorRight - floorLeft, floorBottom - floorTop);
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        floorLeft + 5,
        floorTop + 5,
        floorRight - floorLeft - 10,
        floorBottom - floorTop - 10
      );
      ctx.restore();
    };

    const drawPlayerHero = (x: number, y: number, alignment: number) => {
      ctx.save();
      ctx.translate(x, y);

      const walkBob = Math.sin(player.walkDistance * 0.15) * 3;
      ctx.scale(player.scaleX, player.scaleY);

      const isAsha = alignment >= 20;
      const isAhriman = alignment <= -20;
      ctx.fillStyle = isAsha
        ? 'rgba(251, 191, 36, 0.24)'
        : isAhriman
        ? 'rgba(220, 38, 38, 0.25)'
        : 'rgba(59, 130, 246, 0.18)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sadeh Flint-Fire Parry Shield Ring ([Q])
      if (player.flintShieldTimer > 0) {
        ctx.strokeStyle = '#FDE68A';
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -4, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (player.novaVisualTimer > 0) {
        const progress = 1 - player.novaVisualTimer / 0.45;
        const radius = 30 + progress * 195;
        ctx.strokeStyle = player.novaIsAsha ? '#FDE68A' : '#EF4444';
        ctx.lineWidth = 5 * (1 - progress);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (player.attackPhase !== 'idle') {
        ctx.save();
        ctx.rotate(player.attackAngle);
        const isActivePhase = player.attackPhase === 'active';
        ctx.strokeStyle = isActivePhase
          ? isAhriman
            ? '#EF4444'
            : '#FDE68A'
          : 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = isActivePhase ? 8 : 3;
        ctx.beginPath();
        ctx.arc(12, 0, 56, -Math.PI * 0.48, Math.PI * 0.48);
        ctx.stroke();
        ctx.restore();
      }

      ctx.translate(0, walkBob);
      ctx.fillStyle = player.hitFlashTimer > 0 ? '#FFFFFF' : '#B45309';
      ctx.strokeStyle = '#0B0908';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-15, 16);
      ctx.lineTo(-11, -10);
      ctx.lineTo(11, -10);
      ctx.lineTo(15, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (player.hitFlashTimer <= 0) {
        ctx.fillStyle = '#1C1917';
        ctx.beginPath();
        ctx.arc(-5, 4, 2, 0, Math.PI * 2);
        ctx.arc(5, 7, 2, 0, Math.PI * 2);
        ctx.arc(0, -2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = isAhriman ? '#EF4444' : '#FDE68A';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -18, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = player.hitFlashTimer > 0 ? '#FFFFFF' : '#F5E6C8';
      ctx.strokeStyle = '#0B0908';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -18, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.moveTo(-8, -24);
      ctx.lineTo(-5, -33);
      ctx.lineTo(0, -27);
      ctx.lineTo(5, -33);
      ctx.lineTo(8, -24);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const drawEnemyEntity = (en: EnemyEntity) => {
      ctx.save();
      ctx.translate(en.x, en.y);

      if (en.state === 'ko') {
        const koProgress = 1 - en.koTimer / 0.38;
        ctx.rotate(koProgress * 1.3);
        ctx.scale(1 - koProgress * 0.4, 1 - koProgress * 0.4);
        ctx.globalAlpha = Math.max(0, 1 - koProgress);
      }

      // Telegraph Visual Indicator
      if (en.state === 'telegraph') {
        const ratio = Math.min(1, en.stateTimer / Math.max(0.1, en.telegraphDuration));
        if (en.archetype === 'poulad_charger') {
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.78)';
          ctx.lineWidth = 3 + ratio * 3;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(en.targetX - en.x, en.targetY - en.y);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.strokeStyle = '#FDE68A';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, en.radius + 8 + (1 - ratio) * 14, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const isFlash = en.hitFlashTimer > 0;
      const bodyColor = isFlash
        ? '#FFFFFF'
        : en.state === 'bound'
        ? '#451A03'
        : en.archetype === 'gurg_swarmer'
        ? '#7F1D1D'
        : en.archetype === 'jadu_kiter'
        ? '#311042'
        : en.archetype === 'poulad_charger'
        ? '#3F3F46'
        : '#18181B';

      ctx.fillStyle = bodyColor;
      ctx.strokeStyle =
        en.state === 'bound'
          ? '#FDE68A'
          : en.archetype === 'div_siah_boss'
          ? '#F59E0B'
          : '#0B0908';
      ctx.lineWidth = en.state === 'bound' || en.archetype === 'div_siah_boss' ? 3 : 2;

      ctx.beginPath();
      ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Kemend Chains when Div is Staggered / Bound ([F] Finisher Ready!)
      if (en.state === 'bound') {
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.ellipse(0, 0, en.radius + 6, en.radius * 0.55, 0.35, 0, Math.PI * 2);
        ctx.ellipse(0, 0, en.radius + 6, en.radius * 0.55, -0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#FDE68A';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[F] دیوبند', 0, -en.radius - 20);
      }

      // Curved Demon Horns
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.moveTo(-en.radius * 0.55, -en.radius * 0.65);
      ctx.lineTo(-en.radius * 0.95, -en.radius * 1.35);
      ctx.lineTo(-en.radius * 0.2, -en.radius * 0.85);
      ctx.closePath();
      ctx.moveTo(en.radius * 0.55, -en.radius * 0.65);
      ctx.lineTo(en.radius * 0.95, -en.radius * 1.35);
      ctx.lineTo(en.radius * 0.2, -en.radius * 0.85);
      ctx.closePath();
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = en.state === 'telegraph' || en.state === 'bound' ? '#FDE68A' : '#EF4444';
      ctx.beginPath();
      ctx.arc(-5, -3, 2.6, 0, Math.PI * 2);
      ctx.arc(5, -3, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Overhead Health Bar & Talisman Posture Bar
      if (en.state !== 'ko') {
        const barW = en.radius * 1.9;
        // HP Bar
        ctx.fillStyle = '#0B0908';
        ctx.fillRect(-barW / 2, -en.radius - 15, barW, 4);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-barW / 2, -en.radius - 15, barW * Math.max(0, en.hp / en.maxHp), 4);

        // Golden Talisman Posture Bar
        if (en.posture > 0 || en.state === 'bound') {
          ctx.fillStyle = '#0B0908';
          ctx.fillRect(-barW / 2, -en.radius - 10, barW, 3);
          ctx.fillStyle = '#FDE68A';
          const pRatio = en.state === 'bound' ? 1 : Math.min(1, en.posture / en.maxPosture);
          ctx.fillRect(-barW / 2, -en.radius - 10, barW * pRatio, 3);
        }
      }

      ctx.restore();
    };

    let lastTime = performance.now();
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const scheduleNextFrame = () => {
      if (disposed) return;
      timerId = setTimeout(() => {
        if (!disposed) {
          tick(performance.now());
        }
      }, 25);
    };

    const tick = (now: number) => {
      if (disposed) return;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = clampDt(rawDt);

      const p = propsRef.current;
      titlePanTime += dt;
      cameraTrauma = Math.max(0, cameraTrauma - dt * 1.8);

      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const pt = particles[i];
        if (!pt.active) continue;
        pt.life -= dt;
        if (pt.life <= 0) {
          pt.active = false;
          continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.alpha = Math.max(0, pt.life / pt.maxLife);
      }

      // 1. TITLE SCREEN SHOWCASE
      if (p.gameState === 'title') {
        drawPersianMiniatureWorld(titlePanTime * 1.5, 2);
        const heroShowcaseX =
          p.settings.language === 'en'
            ? viewWidth * 0.72 + Math.sin(titlePanTime * 0.8) * 14
            : viewWidth * 0.28 + Math.sin(titlePanTime * 0.8) * 14;
        const heroShowcaseY = viewHeight * 0.58;

        ctx.save();
        ctx.translate(heroShowcaseX, heroShowcaseY);
        ctx.fillStyle = '#7F1D1D';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.fillRect(-110, 26, 220, 28);
        ctx.strokeRect(-110, 26, 220, 28);
        ctx.fillStyle = '#1E3A8A';
        ctx.fillRect(-82, 4, 164, 24);
        ctx.strokeRect(-82, 4, 164, 24);

        ctx.strokeStyle = 'rgba(253, 230, 138, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -36, 92, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(heroShowcaseX, heroShowcaseY - 22);
        ctx.scale(2.15, 2.15);
        drawPlayerHero(0, 0, 30);
        ctx.restore();

        if (Math.random() < 0.35) {
          spawnParticles(
            heroShowcaseX + (Math.random() - 0.5) * 130,
            heroShowcaseY + 10,
            1,
            '#FDE68A',
            15,
            45,
            1.8,
            4.0,
            0.9
          );
        }

        for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
          const pt = particles[i];
          if (!pt.active) continue;
          ctx.save();
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        keysJustPressed.clear();
        scheduleNextFrame();
        return;
      }

      if (activeEpochTracked !== p.runState.epochIndex) {
        resetArenaForEpoch(p.runState.epochIndex);
      }

      const isSimulationFrozen = p.gameState !== 'playing' || p.isModalOpen;

      if (!isSimulationFrozen) {
        trailingHp += (p.runState.hp - trailingHp) * Math.min(1, dt * 4.5);

        if (hitstopTimer > 0) {
          hitstopTimer = Math.max(0, hitstopTimer - dt);
        } else {
          const simDt = dt;

          player.scaleX += (1 - player.scaleX) * Math.min(1, simDt * 14);
          player.scaleY += (1 - player.scaleY) * Math.min(1, simDt * 14);
          player.invulnTimer = Math.max(0, player.invulnTimer - simDt);
          player.hitFlashTimer = Math.max(0, player.hitFlashTimer - simDt);
          player.dashCooldown = Math.max(0, player.dashCooldown - simDt);
          player.dashBufferTimer = Math.max(0, player.dashBufferTimer - simDt);
          player.attackBufferTimer = Math.max(0, player.attackBufferTimer - simDt);
          player.flintCooldown = Math.max(0, player.flintCooldown - simDt);
          player.flintShieldTimer = Math.max(0, player.flintShieldTimer - simDt);
          player.novaVisualTimer = Math.max(0, player.novaVisualTimer - simDt);

          if (
            keysJustPressed.has('Space') ||
            keysJustPressed.has('KeyJ') ||
            keysJustPressed.has('MouseLeft')
          ) {
            player.attackBufferTimer = 0.13;
          }
          if (
            keysJustPressed.has('ShiftLeft') ||
            keysJustPressed.has('ShiftRight') ||
            keysJustPressed.has('KeyK')
          ) {
            player.dashBufferTimer = 0.13;
          }

          // ===================================================================
          // NEW v1.1 MECHANIC 1: [Key Q] Sang-e Sadeh (Flint-Fire Parry & Throw)
          // ===================================================================
          if (keysJustPressed.has('KeyQ') && player.flintCooldown <= 0) {
            player.flintCooldown = 1.1;
            player.flintShieldTimer = 0.32;
            player.scaleX = 1.18;
            player.scaleY = 0.84;

            const currentLit = braziersState.filter(Boolean).length;
            let anyParried = false;

            // Check nearby telegraphing/attacking enemies for instant Flint Parry!
            enemies.forEach((en) => {
              if (en.state === 'ko') return;
              const dist = Math.hypot(en.x - player.x, en.y - player.y);
              if (dist <= 135) {
                const isTelegraphing = en.state === 'telegraph' || en.state === 'attacking';
                const counter = computeSadehFlintCounter(
                  isTelegraphing,
                  p.runState.sacredFireGuard,
                  currentLit
                );
                en.hp -= counter.damage;
                en.posture += counter.postureDamage;
                en.hitFlashTimer = 0.1;

                if (counter.parrySuccess || en.posture >= en.maxPosture) {
                  anyParried = true;
                  en.state = 'bound';
                  en.stateTimer = 3.8;
                  en.posture = en.maxPosture;
                }
                spawnParticles(en.x, en.y, 14, '#FDE68A', 50, 160, 2.5, 5.5, 0.45);
              }
            });

            // Deflect nearby enemy projectiles into player Sadeh Fireballs
            projectiles.forEach((pr) => {
              if (!pr.active || pr.fromPlayer) return;
              if (Math.hypot(pr.x - player.x, pr.y - player.y) <= 95) {
                pr.fromPlayer = true;
                pr.vx = -pr.vx * 1.4;
                pr.vy = -pr.vy * 1.4;
                pr.damage = 32;
                pr.postureDamage = 45;
                pr.color = '#FDE68A';
                anyParried = true;
              }
            });

            // Also launch a Flint-Spark stone toward player facing angle (can ignite Braziers & hit enemies)
            spawnProjectile(
              true,
              true,
              player.x + Math.cos(player.facingAngle) * 24,
              player.y + Math.sin(player.facingAngle) * 24,
              Math.cos(player.facingAngle) * 460,
              Math.sin(player.facingAngle) * 460,
              22,
              40,
              '#F59E0B',
              8
            );

            soundEngine.playFlintSparkParry(anyParried);
            if (anyParried) {
              hitstopTimer = 0.055 * p.settings.hitstopScale;
              cameraTrauma = Math.min(1, cameraTrauma + 0.35);
              p.onSyncRunState((prev) => ({
                ...prev,
                mythicEnergy: Math.min(100, prev.mythicEnergy + 24),
              }));
            }
          }

          // ===================================================================
          // NEW v1.1/v1.2 MECHANIC 2: [Key F] Kemend-e Divband Finisher
          // ===================================================================
          if (keysJustPressed.has('KeyF')) {
            const targetDiv = enemies.find(
              (en) =>
                en.state !== 'ko' &&
                (en.state === 'bound' || en.hp <= en.maxHp * 0.3) &&
                Math.hypot(en.x - player.x, en.y - player.y) <= 220
            );

            if (targetDiv) {
              // Dash to bound Div & execute Royal Finisher
              player.x = targetDiv.x - Math.cos(player.facingAngle) * 28;
              player.y = targetDiv.y - Math.sin(player.facingAngle) * 28;
              player.invulnTimer = 0.45;
              targetDiv.hp = 0;
              soundEngine.playDivBindFinisher();
              hitstopTimer = 0.065 * p.settings.hitstopScale;
              cameraTrauma = Math.min(1, cameraTrauma + 0.5);

              spawnParticles(targetDiv.x, targetDiv.y, 24, '#FDE68A', 70, 210, 3, 6.5, 0.55);

              p.onSyncRunState((prev) => {
                const { nextState, aoeExplosionDamage } = resolveDivBandFinisher(prev);
                // Damage nearby enemies from finisher shockwave
                enemies.forEach((other) => {
                  if (other.id !== targetDiv.id && other.state !== 'ko') {
                    if (Math.hypot(other.x - targetDiv.x, other.y - targetDiv.y) <= 150) {
                      other.hp -= aoeExplosionDamage;
                      other.posture += 30;
                      other.hitFlashTimer = 0.08;
                    }
                  }
                });
                return nextState;
              });
            }
          }

          // Mythic Art Invocation [E] or [Right Click]
          if (
            (keysJustPressed.has('KeyE') || keysJustPressed.has('MouseRight')) &&
            p.runState.mythicEnergy >= 45
          ) {
            const isAsha = p.runState.alignment >= 0;
            player.novaVisualTimer = 0.45;
            player.novaIsAsha = isAsha;
            soundEngine.playMythicNova(isAsha);
            cameraTrauma = Math.min(1, cameraTrauma + 0.55);
            hitstopTimer = 0.055 * p.settings.hitstopScale;

            const currentLit = braziersState.filter(Boolean).length;
            const novaDmg = computePlayerAttackDamage(
              38,
              p.runState.attackMultiplier,
              p.runState.alignment,
              true,
              currentLit
            );

            enemies.forEach((en) => {
              if (en.state === 'ko') return;
              const dist = Math.hypot(en.x - player.x, en.y - player.y);
              if (dist <= 230) {
                en.hp -= novaDmg;
                en.posture += 45;
                if (en.posture >= en.maxPosture) {
                  en.state = 'bound';
                  en.stateTimer = 3.5;
                }
                en.hitFlashTimer = 0.09;
                const pushAngle = Math.atan2(en.y - player.y, en.x - player.x);
                en.x += Math.cos(pushAngle) * 36;
                en.y += Math.sin(pushAngle) * 36;
                spawnParticles(
                  en.x,
                  en.y,
                  14,
                  isAsha ? '#FDE68A' : '#EF4444',
                  60,
                  180,
                  3,
                  6,
                  0.5
                );
              }
            });

            if (isAsha) {
              projectiles.forEach((pr) => {
                if (!pr.fromPlayer) pr.active = false;
              });
            }

            p.onSyncRunState((prev) => ({
              ...prev,
              mythicEnergy: Math.max(0, prev.mythicEnergy - 45),
              hp:
                !isAsha && prev.lifestealOnKill > 0
                  ? Math.min(prev.maxHp, prev.hp + 10)
                  : prev.hp,
            }));
          }

          // Movement Intent Vector
          let moveX = 0;
          let moveY = 0;
          if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) moveY -= 1;
          if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) moveY += 1;
          if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) moveX -= 1;
          if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) moveX += 1;

          if (moveX !== 0 || moveY !== 0) {
            const len = Math.hypot(moveX, moveY);
            moveX /= len;
            moveY /= len;
            player.facingAngle = Math.atan2(moveY, moveX);
          } else {
            player.facingAngle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
          }

          if (player.dashBufferTimer > 0 && player.dashCooldown <= 0 && player.dashTimer <= 0) {
            player.dashBufferTimer = 0;
            player.dashTimer = 0.16;
            player.dashCooldown = 0.75;
            player.invulnTimer = 0.24;
            player.scaleX = 1.24;
            player.scaleY = 0.78;
            const dashDirX = moveX !== 0 || moveY !== 0 ? moveX : Math.cos(player.facingAngle);
            const dashDirY = moveX !== 0 || moveY !== 0 ? moveY : Math.sin(player.facingAngle);
            player.vx = dashDirX * 560;
            player.vy = dashDirY * 560;
            soundEngine.playDash();
            spawnParticles(player.x, player.y, 8, '#FDE68A', 30, 90, 2, 4, 0.35);
          }

          if (player.dashTimer > 0) {
            player.dashTimer -= simDt;
            if (player.dashTimer <= 0) {
              player.scaleX = 0.86;
              player.scaleY = 1.15;
            }
          } else {
            const moveSpeed = 245;
            player.vx = moveX * moveSpeed;
            player.vy = moveY * moveSpeed;
          }

          const prevX = player.x;
          const prevY = player.y;
          player.x += player.vx * simDt;
          player.y += player.vy * simDt;

          const minX = 76;
          const maxX = viewWidth - 76;
          const minY = Math.max(215, Math.floor(viewHeight * 0.31)) + 34;
          const maxY = viewHeight - 82;
          player.x = Math.max(minX, Math.min(maxX, player.x));
          player.y = Math.max(minY, Math.min(maxY, player.y));

          player.walkDistance += Math.hypot(player.x - prevX, player.y - prevY);

          if (player.attackBufferTimer > 0 && player.attackPhase === 'idle') {
            player.attackBufferTimer = 0;
            player.attackPhase = 'windup';
            player.attackPhaseTimer = 0.055;
            player.attackAngle = player.facingAngle;
            player.attackHitIds.clear();
            player.scaleX = 0.9;
            player.scaleY = 1.1;
            soundEngine.playSwordSlash();
          }

          if (player.attackPhase !== 'idle') {
            player.attackPhaseTimer -= simDt;
            if (player.attackPhase === 'windup' && player.attackPhaseTimer <= 0) {
              player.attackPhase = 'active';
              player.attackPhaseTimer = 0.11;
              player.scaleX = 1.16;
              player.scaleY = 0.86;

              // Check if melee swing ignites a corner Sadeh Brazier!
              const coords = getBrazierCoords();
              coords.forEach((b, idx) => {
                if (!braziersState[idx] && Math.hypot(b.x - player.x, b.y - player.y) <= 85) {
                  braziersState[idx] = true;
                  spawnParticles(b.x, b.y, 16, '#FDE68A', 40, 140, 2.5, 5, 0.5);
                  const litTotal = braziersState.filter(Boolean).length;
                  p.onSyncRunState((prev) => ({ ...prev, braziersLit: litTotal }));
                }
              });

              if (p.runState.alignment >= 20) {
                spawnProjectile(
                  true,
                  false,
                  player.x + Math.cos(player.attackAngle) * 28,
                  player.y + Math.sin(player.attackAngle) * 28,
                  Math.cos(player.attackAngle) * 430,
                  Math.sin(player.attackAngle) * 430,
                  14,
                  18,
                  '#FDE68A',
                  6
                );
              }
            } else if (player.attackPhase === 'active') {
              const currentLit = braziersState.filter(Boolean).length;
              const strikeDamage = computePlayerAttackDamage(
                28,
                p.runState.attackMultiplier,
                p.runState.alignment,
                false,
                currentLit
              );
              enemies.forEach((en) => {
                if (en.state === 'ko' || player.attackHitIds.has(en.id)) return;
                const dx = en.x - player.x;
                const dy = en.y - player.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= 82 + en.radius) {
                  const angleToEnemy = Math.atan2(dy, dx);
                  let angleDiff = angleToEnemy - player.attackAngle;
                  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                  if (Math.abs(angleDiff) <= 1.25 || dist <= 38) {
                    player.attackHitIds.add(en.id);
                    en.hp -= strikeDamage;
                    en.posture += 24;
                    if (en.posture >= en.maxPosture && en.hp > 0) {
                      en.state = 'bound';
                      en.stateTimer = 3.5;
                    }
                    en.hitFlashTimer = 0.06;
                    const knock = 24;
                    en.x += Math.cos(angleToEnemy) * knock;
                    en.y += Math.sin(angleToEnemy) * knock;

                    const isKill = en.hp <= 0;
                    soundEngine.playHeavyHit(isKill);
                    hitstopTimer = (isKill ? 0.055 : 0.032) * p.settings.hitstopScale;
                    cameraTrauma = Math.min(1, cameraTrauma + (isKill ? 0.38 : 0.18));
                    spawnParticles(
                      en.x,
                      en.y,
                      isKill ? 20 : 10,
                      isKill ? '#FDE68A' : '#EF4444',
                      50,
                      170,
                      2.5,
                      5.5,
                      0.45
                    );
                  }
                }
              });

              if (player.attackPhaseTimer <= 0) {
                player.attackPhase = 'recovery';
                player.attackPhaseTimer = 0.1;
              }
            } else if (player.attackPhase === 'recovery' && player.attackPhaseTimer <= 0) {
              player.attackPhase = 'idle';
            }
          }

          // Spawn Wave & Boss Logic
          const livingEnemies = enemies.filter((e) => e.state !== 'ko');
          spawnTimer -= simDt;
          if (spawnTimer <= 0 && livingEnemies.length < 5) {
            if (epochKills >= epochTargetKills - 1 && !bossSpawnedInEpoch) {
              bossSpawnedInEpoch = true;
              spawnEnemyForEpoch(p.runState.epochIndex, true);
              spawnTimer = 4.5;
            } else if (!bossSpawnedInEpoch) {
              spawnEnemyForEpoch(p.runState.epochIndex, false);
              spawnTimer = Math.max(1.6, 3.1 - p.runState.epochIndex * 0.35);
            }
          }

          let activeTokens = enemies.filter(
            (e) => e.state !== 'ko' && (e.state === 'telegraph' || e.state === 'attacking')
          ).length;

          const bCoords = getBrazierCoords();

          for (let i = enemies.length - 1; i >= 0; i--) {
            const en = enemies[i];
            en.hitFlashTimer = Math.max(0, en.hitFlashTimer - simDt);
            en.phaseTimer += simDt;

            // Lit Sadeh Braziers burn nearby Divs over time!
            bCoords.forEach((b, bIdx) => {
              if (braziersState[bIdx] && en.state !== 'ko') {
                if (Math.hypot(en.x - b.x, en.y - b.y) <= 55) {
                  en.hp -= 12 * simDt;
                  en.posture += 15 * simDt;
                }
              }
            });

            if (en.hp <= 0 && en.state !== 'ko') {
              en.state = 'ko';
              en.koTimer = 0.38;
              epochKills += en.archetype === 'div_siah_boss' ? 3 : 1;

              p.onSyncRunState((prev) => ({
                ...prev,
                score: prev.score + (en.archetype === 'div_siah_boss' ? 350 : 100),
                enemiesVanquished: prev.enemiesVanquished + 1,
                mythicEnergy: Math.min(100, prev.mythicEnergy + 16),
                hp: Math.min(prev.maxHp, prev.hp + prev.lifestealOnKill),
              }));
              continue;
            }

            if (en.state === 'ko') {
              en.koTimer -= simDt;
              if (en.koTimer <= 0) {
                const wasBoss = en.archetype === 'div_siah_boss';
                enemies.splice(i, 1);
                if (wasBoss) {
                  p.onEpochWaveCleared();
                }
              }
              continue;
            }

            // Staggered / Bound state (`دیوبند`)
            if (en.state === 'bound') {
              en.stateTimer -= simDt;
              if (en.stateTimer <= 0) {
                en.state = 'seeking';
                en.posture = 0;
              }
              continue;
            }

            en.attackCooldown = Math.max(0, en.attackCooldown - simDt);

            if (en.state === 'seeking') {
              const canClaimToken = activeTokens < MAX_ATTACK_TOKENS;
              const intent = evaluateEnemyPolicy(
                en.archetype,
                en.x,
                en.y,
                player.x,
                player.y,
                en.speed,
                en.attackCooldown <= 0,
                canClaimToken,
                en.phaseTimer
              );
              en.vx = intent.vx;
              en.vy = intent.vy;
              en.x += en.vx * simDt;
              en.y += en.vy * simDt;

              if (intent.shouldStartTelegraph) {
                en.state = 'telegraph';
                en.stateTimer = 0;
                en.targetX = player.x;
                en.targetY = player.y;
                activeTokens++;
                soundEngine.playTelegraphWarning();

                if (en.archetype === 'div_siah_boss') {
                  spawnHazard(player.x, player.y, 62, en.telegraphDuration, en.damage);
                }
              }
            } else if (en.state === 'telegraph') {
              en.stateTimer += simDt;
              if (en.stateTimer >= en.telegraphDuration) {
                en.state = 'attacking';
                en.stateTimer = 0.22;

                const angle = Math.atan2(en.targetY - en.y, en.targetX - en.x);
                if (en.archetype === 'jadu_kiter') {
                  spawnProjectile(
                    false,
                    false,
                    en.x,
                    en.y,
                    Math.cos(angle) * 290,
                    Math.sin(angle) * 290,
                    en.damage,
                    0,
                    '#EF4444',
                    7
                  );
                } else if (en.archetype === 'poulad_charger') {
                  en.vx = Math.cos(angle) * 430;
                  en.vy = Math.sin(angle) * 430;
                } else {
                  en.vx = Math.cos(angle) * 290;
                  en.vy = Math.sin(angle) * 290;
                }
              }
            } else if (en.state === 'attacking') {
              en.stateTimer -= simDt;
              en.x += en.vx * simDt;
              en.y += en.vy * simDt;

              const distToPlayer = Math.hypot(en.x - player.x, en.y - player.y);
              if (distToPlayer <= en.radius + 16 && player.invulnTimer <= 0) {
                if (player.flintShieldTimer > 0) {
                  // Auto-parried by active [Q] Sadeh Shield!
                  en.state = 'bound';
                  en.stateTimer = 3.5;
                  en.posture = en.maxPosture;
                  soundEngine.playFlintSparkParry(true);
                } else {
                  const dmg = computePlayerDamageReceived(
                    en.damage,
                    p.runState.sacredFireGuard,
                    p.runState.iranshahrStability
                  );
                  player.invulnTimer = 0.65;
                  player.hitFlashTimer = 0.14;
                  hitstopTimer = 0.05 * p.settings.hitstopScale;
                  cameraTrauma = Math.min(1, cameraTrauma + 0.45);
                  soundEngine.playPlayerHurt();
                  spawnParticles(player.x, player.y, 16, '#DC2626', 60, 170, 3, 6, 0.45);
                  p.onSyncRunState((prev) => ({
                    ...prev,
                    hp: Math.max(0, prev.hp - dmg),
                  }));
                }
              }

              if (en.stateTimer <= 0) {
                en.state = 'recovering';
                en.stateTimer = 0.45;
                en.attackCooldown = 1.25 + Math.random() * 0.5;
              }
            } else if (en.state === 'recovering') {
              en.stateTimer -= simDt;
              if (en.stateTimer <= 0) {
                en.state = 'seeking';
              }
            }

            const enemyMinY = Math.max(215, Math.floor(viewHeight * 0.31)) + 34;
            en.x = Math.max(76, Math.min(viewWidth - 76, en.x));
            en.y = Math.max(enemyMinY, Math.min(viewHeight - 82, en.y));
          }

          // Step Projectiles (including Sadeh Flint Stones igniting corner Braziers!)
          for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
            const pr = projectiles[i];
            if (!pr.active) continue;
            pr.life -= simDt;
            if (pr.life <= 0) {
              pr.active = false;
              continue;
            }
            pr.x += pr.vx * simDt;
            pr.y += pr.vy * simDt;

            if (pr.fromPlayer) {
              // Check if Flint Stone hits a corner Brazier
              if (pr.isFlintStone) {
                bCoords.forEach((b, idx) => {
                  if (!braziersState[idx] && Math.hypot(b.x - pr.x, b.y - pr.y) <= 32) {
                    braziersState[idx] = true;
                    spawnParticles(b.x, b.y, 18, '#FDE68A', 50, 160, 3, 6, 0.55);
                    const litTotal = braziersState.filter(Boolean).length;
                    p.onSyncRunState((prev) => ({ ...prev, braziersLit: litTotal }));
                  }
                });
              }

              for (const en of enemies) {
                if (en.state === 'ko') continue;
                if (Math.hypot(en.x - pr.x, en.y - pr.y) <= en.radius + pr.radius) {
                  en.hp -= pr.damage;
                  en.posture += pr.postureDamage;
                  if (en.posture >= en.maxPosture && en.hp > 0) {
                    en.state = 'bound';
                    en.stateTimer = 3.6;
                  }
                  en.hitFlashTimer = 0.06;
                  pr.active = false;
                  spawnParticles(pr.x, pr.y, 10, '#FDE68A', 40, 120, 2, 4.5, 0.35);
                  break;
                }
              }
            } else if (player.invulnTimer <= 0) {
              if (Math.hypot(player.x - pr.x, player.y - pr.y) <= 18 + pr.radius) {
                if (player.flintShieldTimer > 0) {
                  // Deflected by [Q] Sadeh Flint Parry!
                  pr.fromPlayer = true;
                  pr.vx = -pr.vx * 1.4;
                  pr.vy = -pr.vy * 1.4;
                  pr.color = '#FDE68A';
                  pr.damage = 30;
                  pr.postureDamage = 45;
                  soundEngine.playFlintSparkParry(true);
                } else {
                  pr.active = false;
                  const dmg = computePlayerDamageReceived(
                    pr.damage,
                    p.runState.sacredFireGuard,
                    p.runState.iranshahrStability
                  );
                  player.invulnTimer = 0.55;
                  player.hitFlashTimer = 0.14;
                  hitstopTimer = 0.04 * p.settings.hitstopScale;
                  cameraTrauma = Math.min(1, cameraTrauma + 0.35);
                  soundEngine.playPlayerHurt();
                  spawnParticles(player.x, player.y, 14, '#EF4444', 50, 150, 2.5, 5, 0.4);
                  p.onSyncRunState((prev) => ({
                    ...prev,
                    hp: Math.max(0, prev.hp - dmg),
                  }));
                }
              }
            }
          }

          // Step Boss Ground Hazards
          for (let i = 0; i < HAZARD_POOL_SIZE; i++) {
            const hz = hazards[i];
            if (!hz.active) continue;
            hz.timer -= simDt;
            if (hz.timer <= 0) {
              hz.active = false;
              spawnParticles(hz.x, hz.y, 20, '#EF4444', 60, 200, 3, 6, 0.5);
              if (
                Math.hypot(player.x - hz.x, player.y - hz.y) <= hz.radius &&
                player.invulnTimer <= 0 &&
                player.flintShieldTimer <= 0
              ) {
                const dmg = computePlayerDamageReceived(
                  hz.damage,
                  p.runState.sacredFireGuard,
                  p.runState.iranshahrStability
                );
                player.invulnTimer = 0.65;
                player.hitFlashTimer = 0.15;
                hitstopTimer = 0.055 * p.settings.hitstopScale;
                cameraTrauma = Math.min(1, cameraTrauma + 0.5);
                soundEngine.playPlayerHurt();
                p.onSyncRunState((prev) => ({
                  ...prev,
                  hp: Math.max(0, prev.hp - dmg),
                }));
              }
            }
          }

          if (p.runState.hp <= 0) {
            defeatDelayTimer += simDt;
            if (defeatDelayTimer >= 0.45) {
              defeatDelayTimer = 0;
              p.onPlayerDefeated();
            }
          }
        }
      }

      // 2. RENDER ACTIVE PERSIAN MINIATURE ARENA
      ctx.save();
      const shakeMag =
        cameraTrauma * cameraTrauma * 14 * p.settings.cameraShakeIntensity;
      if (shakeMag > 0.2) {
        ctx.translate(
          (Math.random() * 2 - 1) * shakeMag,
          (Math.random() * 2 - 1) * shakeMag
        );
      }

      drawPersianMiniatureWorld(0, p.runState.epochIndex);

      for (let i = 0; i < HAZARD_POOL_SIZE; i++) {
        const hz = hazards[i];
        if (!hz.active) continue;
        const progress = 1 - hz.timer / hz.maxTimer;
        ctx.save();
        ctx.strokeStyle = '#EF4444';
        ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(hz.x, hz.y, hz.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#FDE68A';
        ctx.beginPath();
        ctx.arc(hz.x, hz.y, hz.radius * progress, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const en of enemies) {
        drawEnemyEntity(en);
      }

      drawPlayerHero(player.x, player.y, p.runState.alignment);

      for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
        const pr = projectiles[i];
        if (!pr.active) continue;
        ctx.save();
        ctx.fillStyle = pr.color;
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const pt = particles[i];
        if (!pt.active) continue;
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (p.runState.hp > 0 && p.runState.hp <= p.runState.maxHp * 0.3) {
        const vig = ctx.createRadialGradient(
          viewWidth / 2,
          viewHeight / 2,
          viewWidth * 0.28,
          viewWidth / 2,
          viewHeight / 2,
          viewWidth * 0.65
        );
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(153, 27, 27, 0.42)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, viewWidth, viewHeight);
      }

      ctx.restore();

      if (now - lastTelemetryPush >= 120) {
        lastTelemetryPush = now;
        const activeBoss = enemies.find(
          (e) => e.archetype === 'div_siah_boss' && e.state !== 'ko'
        );
        const boundCount = enemies.filter((e) => e.state === 'bound').length;
        const litCount = braziersState.filter(Boolean).length;

        p.onSyncTelemetry({
          hp: p.runState.hp,
          maxHp: p.runState.maxHp,
          trailingHp: Math.round(trailingHp),
          mythicEnergy: Math.round(p.runState.mythicEnergy),
          waveProgress: Math.min(100, Math.round((epochKills / epochTargetKills) * 100)),
          bossActive: Boolean(activeBoss),
          bossName: activeBoss ? activeBoss.name : '',
          bossHp: activeBoss ? Math.max(0, Math.round(activeBoss.hp)) : 0,
          bossMaxHp: activeBoss ? activeBoss.maxHp : 100,
          activeEnemyCount: enemies.filter((e) => e.state !== 'ko').length,
          boundEnemiesCount: boundCount,
          braziersLit: litCount,
          flintReady: player.flintCooldown <= 0,
        });
      }

      keysJustPressed.clear();
      scheduleNextFrame();
    };

    tick(performance.now());

    return () => {
      disposed = true;
      if (timerId !== null) clearTimeout(timerId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-screen h-screen overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        tabIndex={0}
        aria-label="Shahnameh 2D Persian Miniature Battlefield Canvas"
        className="block w-full h-full focus:outline-none"
      />
    </div>
  );
};
