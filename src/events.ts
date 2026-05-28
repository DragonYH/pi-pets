import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PetEngine } from './pet_instance.ts';
import { CONFIG } from './config.ts';
import { buildWidget } from './ui/widget.ts';
import { buildFooterStatus } from './ui/footer.ts';
import { getRandomBubble } from './ui/bubbles.ts';

const WIDGET_KEY = 'pi-pets';

export function bindEvents(pi: ExtensionAPI, engine: PetEngine) {
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let renderTimer: ReturnType<typeof setInterval> | null = null;
  let lastBubbleRefreshTime = Date.now();

  // ---- Session start: load state ----
  pi.on('session_start', async (_event, ctx) => {
    const loaded = await engine.load();
    if (loaded && engine.state) {
      engine.onSessionStart();
      ctx.ui.setWidget(WIDGET_KEY, ['正在加载宠物...']);

      // Start tick timer
      if (tickTimer === null) {
        tickTimer = setInterval(() => {
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
          if (!engine.hasPet) return;
          engine.animationFrame = (engine.animationFrame + 1) % CONFIG.ANIM_FRAMES;
          const bubble = engine.currentBubble || getRandomBubble('happy');
          const lines = buildWidget(engine, engine.animationFrame, bubble);
          ctx.ui.setWidget(WIDGET_KEY, lines);
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
        }, CONFIG.RENDER_INTERVAL);
      }

      // Show widget after a short delay
      setTimeout(() => {
        const bubble = engine.currentBubble || getRandomBubble('happy');
        ctx.ui.setWidget(WIDGET_KEY, buildWidget(engine, 0, bubble));
        ctx.ui.setStatus('pet', buildFooterStatus(engine));
      }, 500);
    }
  });

  // ---- Session shutdown: save state ----
  pi.on('session_shutdown', async () => {
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

    const { leveledUp, newStage, xpGained } = engine.onTurnComplete();

    // Show bubble about XP gained
    engine.setBubble(`赚了 ${xpGained} XP！`);
    lastBubbleRefreshTime = Date.now();

    // Handle level-up
    if (leveledUp && engine.state) {
      const { levelUpOverlay } = await import('./ui/overlay.ts');
      ctx.ui.setWidget(WIDGET_KEY, levelUpOverlay(engine.state.name, engine.state.level));
      setTimeout(() => {
        ctx.ui.setWidget(WIDGET_KEY, buildWidget(engine, 0, engine.currentBubble));
        ctx.ui.setStatus('pet', buildFooterStatus(engine));
      }, 2500);
    }

    // Handle stage evolution
    if (newStage && engine.state) {
      const { evolutionOverlay } = await import('./ui/overlay.ts');
      ctx.ui.setWidget(WIDGET_KEY, evolutionOverlay(engine.state.name, newStage));
      setTimeout(() => {
        ctx.ui.setWidget(WIDGET_KEY, buildWidget(engine, 0, engine.currentBubble));
        ctx.ui.setStatus('pet', buildFooterStatus(engine));
      }, 3000);
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
