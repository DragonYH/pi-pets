import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PetEngine } from './pet_instance.ts';
import { buildWidget } from './ui/widget.ts';
import { buildFooterStatus } from './ui/footer.ts';
import { getRandomBubble } from './ui/bubbles.ts';
import { levelUpOverlay, evolutionOverlay } from './ui/overlay.ts';
import { hashString } from './prng.ts';
import { xpFromPetCommand, xpFromFeedCommand } from './xp.ts';

const WIDGET_KEY = 'pi-pets';

export function registerCommands(pi: ExtensionAPI, engine: PetEngine) {
  let currentBubble = getRandomBubble('happy');
  let widgetVisible = true;
  let animationFrame = 0;
  let renderTimer: ReturnType<typeof setInterval> | null = null;

  // ===== Animation / render loop =====

  function startRenderLoop(ctx?: { ui: { setWidget: (k: string, lines: string[] | undefined) => void; setStatus: (k: string, text: string | undefined) => void } }) {
    stopRenderLoop();
    renderTimer = setInterval(() => {
      animationFrame = (animationFrame + 1) % 4;

      // Update footer
      const footerText = buildFooterStatus(engine);
      if (ctx) {
        ctx.ui.setStatus('pet', footerText);
      }

      // Update widget if visible
      if (widgetVisible && ctx) {
        const widgetLines = buildWidget(engine, animationFrame, currentBubble);
        ctx.ui.setWidget(WIDGET_KEY, widgetLines);
      }
    }, 500);
  }

  function stopRenderLoop() {
    if (renderTimer !== null) {
      clearInterval(renderTimer);
      renderTimer = null;
    }
  }

  // ===== Helper to get ctx from command handler =====

  function updateWidget(ctx: { ui: { setWidget: (k: string, lines: string[] | undefined) => void } }) {
    const lines = buildWidget(engine, animationFrame, currentBubble);
    ctx.ui.setWidget(WIDGET_KEY, lines);
  }

  function showOverlay(ctx: { ui: { setWidget: (k: string, lines: string[] | undefined) => void } }, lines: string[]) {
    ctx.ui.setWidget(WIDGET_KEY, lines);
    // Auto-hide overlay after 2s
    setTimeout(() => {
      if (widgetVisible) {
        updateWidget(ctx);
      } else {
        ctx.ui.setWidget(WIDGET_KEY, undefined);
      }
    }, 2000);
  }

  // ===== Commands =====

  pi.registerCommand('pets', {
    description: '宠物系统 - 查看/饲养你的编码伙伴',
    getArgumentCompletions: (prefix: string) => {
      const subcommands = ['hatch', 'status', 'pet', 'feed', 'name', 'toggle', 'release'];
      return subcommands
        .filter((c) => c.startsWith(prefix))
        .map((c) => ({ value: c, label: c, insertValue: c }));
    },
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0]?.toLowerCase() || 'status';

      switch (sub) {
        // ---- hatch ----
        case 'hatch': {
          if (engine.hasPet) {
            const confirmed = await ctx.ui.confirm(
              '已有宠物',
              `当前有宠物 "${engine.petName}"。孵化新宠物会替换它。确定？`,
            );
            if (!confirmed) {
              ctx.ui.notify('孵化已取消', 'info');
              return;
            }
          }

          // Generate seed from pi config path or fallback to timestamp
          const seedArg = parts[1];
          let seed: number;
          if (seedArg) {
            seed = hashString(seedArg);
          } else {
            // Try to get seed from pi config; use hash of hostname+user as fallback
            const { hostname } = await import('node:os');
            seed = hashString(`pi-pets-${hostname()}-${Date.now()}`);
          }

          const result = await engine.hatch(seed);
          ctx.ui.notify(`🐣 孵化成功！欢迎 "${result.name}" (${result.stage})`, 'info');

          currentBubble = getRandomBubble('excited');
          startRenderLoop(ctx);
          updateWidget(ctx);
          break;
        }

        // ---- status ----
        case 'status': {
          if (!engine.hasPet) {
            ctx.ui.notify('还没有宠物！使用 /pets hatch 孵化一只', 'warning');
            return;
          }
          widgetVisible = true;
          updateWidget(ctx);
          ctx.ui.notify('宠物面板已显示', 'info');
          break;
        }

        // ---- pet (pet) ----
        case 'pet': {
          if (!engine.hasPet) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          engine.doPet();
          engine.addXp(xpFromPetCommand());
          currentBubble = '嗯～好舒服～';
          updateWidget(ctx);
          ctx.ui.notify('你摸了摸宠物，它很开心！', 'info');
          break;
        }

        // ---- feed ----
        case 'feed': {
          if (!engine.hasPet) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          engine.doFeed();
          engine.addXp(xpFromFeedCommand());
          currentBubble = '好吃！谢谢～';
          updateWidget(ctx);
          ctx.ui.notify('宠物吃饱了！', 'info');
          break;
        }

        // ---- name ----
        case 'name': {
          if (!engine.hasPet) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          const newName = parts.slice(1).join(' ');
          if (!newName) {
            ctx.ui.notify('请提供新名称：/pets name <新名字>', 'warning');
            return;
          }
          // Validate: filter control chars, trim, length check
          const sanitized = newName.replace(/[\x00-\x1F\x7F]/g, '').trim();
          if (!sanitized || sanitized.length > 32) {
            ctx.ui.notify('名称长度需在 1-32 字符之间，且不能包含控制字符', 'warning');
            return;
          }
          engine.state!.name = sanitized;
          await engine.save();
          updateWidget(ctx);
          ctx.ui.notify(`宠物已重命名为 "${sanitized}"`, 'info');
          break;
        }

        // ---- toggle ----
        case 'toggle': {
          widgetVisible = !widgetVisible;
          if (widgetVisible) {
            updateWidget(ctx);
            ctx.ui.notify('宠物面板已显示', 'info');
          } else {
            ctx.ui.setWidget(WIDGET_KEY, undefined);
            ctx.ui.notify('宠物面板已隐藏', 'info');
          }
          break;
        }

        // ---- release ----
        case 'release': {
          if (!engine.hasPet) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          const confirmed = await ctx.ui.confirm(
            '放生宠物',
            `确定要放生 "${engine.petName}" 吗？此操作不可撤销！`,
          );
          if (!confirmed) {
            ctx.ui.notify('放生已取消', 'info');
            return;
          }
          const name = engine.petName;
          await engine.release();
          stopRenderLoop();
          ctx.ui.setWidget(WIDGET_KEY, undefined);
          ctx.ui.setStatus('pet', undefined);
          ctx.ui.notify(`"${name}" 已放生。一路走好...`, 'info');
          break;
        }

        // ---- help ----
        default: {
          ctx.ui.notify(
            '子命令: hatch [seed], status, pet, feed, name <名字>, toggle, release',
            'info',
          );
          break;
        }
      }
    },
  });
}
