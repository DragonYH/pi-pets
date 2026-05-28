import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import type { PetEngine } from './pet_instance.ts';
import { CONFIG } from './config.ts';
import { buildWidget } from './ui/widget.ts';
import { buildFooterStatus } from './ui/footer.ts';
import { getRandomBubble } from './ui/bubbles.ts';
import { loadCodexPet, setAnimationOverride } from './codex/art-provider.ts';

const WIDGET_KEY = 'pi-pets';

export function bindEvents(pi: ExtensionAPI, engine: PetEngine) {
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let renderTimer: ReturnType<typeof setInterval> | null = null;
  let lastBubbleRefreshTime = Date.now();

// ---- Stale-ctx guard ----
let sessionActive = false;
let safeUi: ExtensionContext['ui'] | null = null;
const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

  // ---- Session start: load state ----
  pi.on('session_start', async (_event, ctx) => {
    const loaded = await engine.load();
    if (loaded && engine.state) {
      engine.onSessionStart();

      // Extract ui while context is definitely active; the getter check passes here.
      safeUi = ctx.ui;

      // Preload codex pet frames into memory
      try {
        await loadCodexPet(engine.state.bones.species);
      } catch {
        // Pet not imported yet — widget will show fallback
      }
      sessionActive = true;
      safeUi?.setWidget(WIDGET_KEY, ['正在加载宠物...']);

      // Start tick timer
      if (tickTimer === null) {
        tickTimer = setInterval(() => {
          if (!sessionActive) return;
          const emotionChange = engine.tick();
          if (emotionChange) {
            engine.setBubble(getRandomBubble(emotionChange));
          }
          const now = Date.now();
          if (now - lastBubbleRefreshTime > CONFIG.BUBBLE_INTERVAL && engine.state) {
            engine.setBubble(getRandomBubble(engine.state.emotion));
            lastBubbleRefreshTime = now;
          }
        }, CONFIG.TICK_INTERVAL);
      }

      // Start render timer (single animation loop)
      if (renderTimer === null) {
        renderTimer = setInterval(() => {
          if (!sessionActive || !safeUi) return;
          if (!engine.hasPet) return;
          engine.animationFrame = (engine.animationFrame + 1) % CONFIG.ANIM_FRAMES;
          const bubble = engine.currentBubble || getRandomBubble('happy');
          const lines = buildWidget(engine, engine.animationFrame, bubble);
          safeUi.setWidget(WIDGET_KEY, lines);
          safeUi.setStatus('pet', buildFooterStatus(engine));
        }, CONFIG.RENDER_INTERVAL);
      }

      // Show widget after a short delay
      {
        const t = setTimeout(() => {
          pendingTimeouts.delete(t);
          if (!sessionActive || !safeUi) return;
          const bubble = engine.currentBubble || getRandomBubble('happy');
          safeUi.setWidget(WIDGET_KEY, buildWidget(engine, 0, bubble));
          safeUi.setStatus('pet', buildFooterStatus(engine));
        }, 500);
        pendingTimeouts.add(t);
      }
    }
  });

  // ---- Session shutdown: save state ----
  pi.on('session_shutdown', async () => {
    // Immediately deactivate: any in-flight timer callback will bail out.
    sessionActive = false;

    // Clear all pending one-shot timeouts.
    for (const t of pendingTimeouts) {
      clearTimeout(t);
    }
    pendingTimeouts.clear();

    await engine.save();
    if (tickTimer !== null) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
    if (renderTimer !== null) {
      clearInterval(renderTimer);
      renderTimer = null;
    }
  });

  // ---- Turn end: XP and emotion ----
  pi.on('turn_end', async (_event, ctx) => {
    if (!engine.hasPet) return;
    const ui = ctx.ui;

    const { leveledUp, newStage, xpGained } = engine.onTurnComplete();

    // Show bubble about XP gained
    engine.setBubble(`赚了 ${xpGained} XP！`);
    lastBubbleRefreshTime = Date.now();

    // Handle level-up
    if (leveledUp && engine.state) {
      const { levelUpOverlay } = await import('./ui/overlay.ts');
      ui.setWidget(WIDGET_KEY, levelUpOverlay(engine.state.name, engine.state.level));
      {
        const t = setTimeout(() => {
          pendingTimeouts.delete(t);
          if (!sessionActive || !safeUi) return;
          setAnimationOverride('jump', 3000);
          safeUi.setWidget(WIDGET_KEY, buildWidget(engine, 0, engine.currentBubble));
          safeUi.setStatus('pet', buildFooterStatus(engine));
        }, 2500);
        pendingTimeouts.add(t);
      }
    }
    // Handle stage evolution
    if (newStage && engine.state) {
      const { evolutionOverlay } = await import('./ui/overlay.ts');
      ui.setWidget(WIDGET_KEY, evolutionOverlay(engine.state.name, newStage));
      {
        const t = setTimeout(() => {
          pendingTimeouts.delete(t);
          if (!sessionActive || !safeUi) return;
          setAnimationOverride('jump', 3000);
          safeUi.setWidget(WIDGET_KEY, buildWidget(engine, 0, engine.currentBubble));
          safeUi.setStatus('pet', buildFooterStatus(engine));
        }, 3000);
        pendingTimeouts.add(t);
      }
    }
    // Save after every turn
    await engine.save();
  });

  // ---- Tool execution end: track errors / success ----
  pi.on('tool_execution_end', async (_event, ctx) => {
    if (!engine.hasPet) return;
    const isError = _event.isError ?? false;
    const success = !isError;
    engine.onToolExecuted(success, isError);

    // Update UI periodically
    ctx.ui.setStatus('pet', buildFooterStatus(engine));
  });
}
