import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PetEngine } from './pet_instance.ts';
import { buildFooterStatus } from './ui/footer.ts';
import { getRandomBubble } from './ui/bubbles.ts';
import { hashString } from './prng.ts';
import { xpFromPetCommand, xpFromFeedCommand } from './xp.ts';
import { importPet } from './renderer/importer.ts';
import { loadPet, setAnimationOverride } from './renderer/art-provider.ts';

export function registerCommands(
  pi: ExtensionAPI,
  engine: PetEngine,
  overlayControls?: {
    showOverlay: () => void;
    hideOverlay: () => void;
    toggleOverlay: () => boolean;
    isOverlayVisible: () => boolean;
  },
) {

  // ===== Commands =====

  pi.registerCommand('pets', {
    description: '宠物系统 - 查看/饲养你的编码伙伴',
    getArgumentCompletions: (prefix: string) => {
      const subcommands: Array<{ value: string; label: string; description: string }> = [
        { value: 'hatch',   label: 'hatch',   description: '孵化一只新宠物' },
        { value: 'status',  label: 'status',  description: '显示宠物面板' },
        { value: 'pet',     label: 'pet',     description: '抚摸宠物，它会很开心' },
        { value: 'feed',    label: 'feed',    description: '喂食宠物' },
        { value: 'name',    label: 'name',    description: '给宠物改名' },
        { value: 'toggle',  label: 'toggle',  description: '显示/隐藏宠物面板' },
        { value: 'release', label: 'release', description: '放生当前宠物（不可撤销）' },
        { value: 'import',  label: 'import',  description: '导入精灵图宠物' },
      ];
      return subcommands
        .filter((c) => c.value.startsWith(prefix))
        .map((c) => ({ value: c.value, label: c.label, insertValue: c.value, description: c.description }));
    },
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0]?.toLowerCase() || 'status';

      switch (sub) {
        // ---- import ----
        case 'import': {
          const pathArg = parts[1];
          if (!pathArg) {
            ctx.ui.notify('请指定宠物目录路径：/pets import <path>', 'warning');
            return;
          }
          try {
            const result = await importPet(pathArg);

            // Release current pet if any
            if (engine.hasPet) {
              await engine.release();
              ctx.ui.setStatus('pet', undefined);
            }

            // Hatch the imported pet
            const seed = hashString(`imported-${result.speciesId}-${Date.now()}`);
            await engine.hatch(seed, result.speciesId);

            // Preload pet frames into memory
            await loadPet(result.speciesId);

            engine.setBubble(getRandomBubble('excited'));
            ctx.ui.setStatus('pet', buildFooterStatus(engine));
            ctx.ui.notify('🐣 导入成功！欢迎 ' + engine.petName, 'info');
          } catch (err) {
            ctx.ui.notify('导入失败: ' + (err as Error).message, 'error');
          }
          return;
        }

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

          const seedArg = parts[1];
          let seed: number;
          if (seedArg) {
            seed = hashString(seedArg);
          } else {
            const { hostname } = await import('node:os');
            seed = hashString(`pi-pets-${hostname()}-${Date.now()}`);
          }

          await engine.hatch(seed);
          ctx.ui.notify(`🐣 孵化成功！欢迎 "${engine.petName}"`, 'info');

          engine.setBubble(getRandomBubble('excited'));
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          break;
        }

        // ---- status ----
        case 'status': {
          if (!engine.hasPet) {
            ctx.ui.notify('还没有宠物！使用 /pets hatch 孵化一只', 'warning');
            return;
          }
          overlayControls?.showOverlay();
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
          engine.setBubble('嗯～好舒服～');
          setAnimationOverride('play', 2000);
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
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
          engine.setBubble('好吃！谢谢～');
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify('宠物吃饱了！', 'info');
          break;
        }

        // ---- name ----
        case 'name': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          const newName = parts.slice(1).join(' ');
          if (!newName) {
            ctx.ui.notify('请提供新名称：/pets name <新名字>', 'warning');
            return;
          }
          const sanitized = newName.replace(/[\x00-\x1F\x7F]/g, '').trim();
          if (!sanitized || sanitized.length > 32) {
            ctx.ui.notify('名称长度需在 1-32 字符之间，且不能包含控制字符', 'warning');
            return;
          }
          engine.state!.name = sanitized;
          engine.setBubble(`现在我叫 ${sanitized}！`);
          await engine.save();
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(`宠物已重命名为 "${sanitized}"`, 'info');
          break;
        }

        // ---- toggle (hide/show overlay) ----
        case 'toggle': {
          const isVisible = overlayControls?.toggleOverlay() ?? false;
          ctx.ui.notify(isVisible ? '🐾 宠物面板已显示' : '🙈 宠物面板已隐藏', 'info');
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
          ctx.ui.setStatus('pet', undefined);
          ctx.ui.notify(`"${name}" 已放生。一路走好...`, 'info');
          break;
        }

        // ---- help ----
        default: {
          ctx.ui.notify(
            '子命令: hatch [seed], status, pet, feed, name <名字>, toggle, release, import <path>',
            'info',
          );
          break;
        }
      }
    },
  });
}
