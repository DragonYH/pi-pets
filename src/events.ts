import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import type { PetEngine } from './pet_instance.ts';
import { CONFIG } from './config.ts';
import { PetOverlayComponent } from './ui/pet-overlay.ts';
import { buildFooterStatus } from './ui/footer.ts';
import { loadCodexPet } from './codex/art-provider.ts';
import { stageDisplayName } from './evolution.ts';

export function bindEvents(pi: ExtensionAPI, engine: PetEngine) {
  let tickTimer: ReturnType<typeof setInterval> | null = null;

  // ---- Stale-ctx guard ----
  let sessionActive = false;
  let safeUi: ExtensionContext['ui'] | null = null;

  // ---- Overlay lifecycle ----
  let overlayHandle: any = null;
  let overlayComponent: PetOverlayComponent | null = null;

  // ---- Session start: load state + show overlay ----
  pi.on('session_start', async (_event, ctx) => {
    const loaded = await engine.load();
    if (loaded && engine.state) {
      engine.onSessionStart();
      safeUi = ctx.ui;

      // Preload codex pet frames into memory
      try {
        await loadCodexPet(engine.state.bones.species);
      } catch {
        // Pet not imported yet — overlay shows placeholder
      }

      sessionActive = true;

      // ---- Create non-capturing overlay via setWidget factory ----
      // setWidget factory gives us tui access without intercepting keyboard.
      // We create a persistent non-capturing overlay from within the factory,
      // then return an invisible widget so the bridge itself doesn't consume space.
      (safeUi!).setWidget('pi-pets-bridge', ((tui: any, _theme: any) => {
        overlayComponent = new PetOverlayComponent(engine, tui);
        overlayHandle = tui.showOverlay(overlayComponent, {
          nonCapturing: true,
          anchor: 'top-right',
          width: 40,
          margin: { top: 1, right: 1 },
        });
        // Return invisible widget — the overlay is what users see
        return { render: () => [], invalidate: () => {} } as any;
      }) as any);

      // ---- Tick timer: needs decay, emotion change ----
      if (tickTimer === null) {
        tickTimer = setInterval(() => {
          if (!sessionActive) return;
          engine.tick();
        }, CONFIG.TICK_INTERVAL);
      }

      // Set initial footer
      safeUi!.setStatus('pet', buildFooterStatus(engine));
    }
  });

  // ---- Session shutdown: save state + clean up overlay ----
  pi.on('session_shutdown', async () => {
    sessionActive = false;
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }

    // Clean up overlay
    if (overlayComponent) {
      overlayComponent.dispose();
      overlayComponent = null;
    }
    if (overlayHandle) {
      overlayHandle.hide();
      overlayHandle = null;
    }
    if (safeUi) {
      safeUi.setWidget('pi-pets-bridge', undefined);
      safeUi.setStatus('pet', undefined);
    }

    await engine.save();
  });

  // ---- Turn end: XP and emotion ----
  pi.on('turn_end', async (_event, ctx) => {
    if (!engine.hasPet || !engine.state) return;

    const { leveledUp, newStage, xpGained } = engine.onTurnComplete();

    engine.setBubble(`赚了 ${xpGained} XP！`);

    if (leveledUp) {
      ctx.ui.notify(`⬆ ${engine.state.name} 升到 Lv.${engine.state.level}！`, 'info');
    }

    if (newStage) {
      ctx.ui.notify(`🌟 ${engine.state.name} 进化了！→ ${stageDisplayName(newStage)}`, 'info');
    }

    ctx.ui.setStatus('pet', buildFooterStatus(engine));
    await engine.save();
  });

  // ---- Tool execution end: track errors / success ----
  pi.on('tool_execution_end', async (_event, ctx) => {
    if (!engine.hasPet) return;
    const isError = _event.isError ?? false;
    const success = !isError;
    engine.onToolExecuted(success, isError);
    ctx.ui.setStatus('pet', buildFooterStatus(engine));
  });
}
