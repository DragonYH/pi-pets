import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PetEngine } from './pet_instance.ts';
import { buildFooterStatus } from './ui/footer.ts';
import { getRandomBubble } from './ui/bubbles.ts';
import { hashString } from './prng.ts';
import { xpFromPetCommand, xpFromFeedCommand } from './xp.ts';
import { importPet } from './renderer/importer.ts';
import { loadPet, setAnimationOverride, unloadPet, reloadPet } from './renderer/art-provider.ts';
import { invalidateCache, listCachedSpecies, hasCache } from './renderer/cache.ts';
import { getSpecies } from './species.ts';

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
        { value: 'info',    label: 'info',    description: '查看宠物详细档案' },
        { value: 'list',    label: 'list',    description: '列出已导入的宠物' },
        { value: 'pet',     label: 'pet',     description: '抚摸宠物，它会很开心' },
        { value: 'feed',    label: 'feed',    description: '喂食宠物' },
        { value: 'rename',  label: 'rename',  description: '给宠物改名' },
        { value: 'toggle',  label: 'toggle',  description: '显示/隐藏宠物面板' },
        { value: 'release', label: 'release', description: '放生当前宠物（不可撤销）' },
        { value: 'import',  label: 'import',  description: '导入精灵图宠物' },
        { value: 'clean',   label: 'clean',   description: '清除指定宠物的图像缓存' },
        { value: 'help',    label: 'help',    description: '显示全部命令帮助' },
      ];
      return subcommands
        .filter((c) => c.value.startsWith(prefix))
        .map((c) => ({ value: c.value, label: c.label, insertValue: c.value, description: c.description }));
    },
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0]?.toLowerCase() || '';

      switch (sub) {
        // ---- bare /pets (no subcommand) ----
        case '': {
          if (!engine.hasPet) {
            ctx.ui.notify(
              '还没有宠物！使用 /pets hatch [seed] 孵化一只，或 /pets import <path> 导入精灵图宠物。输入 /pets help 查看全部命令。',
              'info',
            );
            return;
          }
          const s = engine.state!;
          const sp = getSpecies(s.bones.species);
          const shinyMark = s.bones.isShiny ? ' ✨' : '';
          const genderMark = s.bones.gender === 'male' ? '♂' : '♀';
          ctx.ui.notify(
            `"${s.name}" — ${sp.emoji} ${sp.name} (${engine.rarityLabel}${shinyMark} ${genderMark})\n` +
            `Lv.${s.level} ${engine.stageName} · ⭐${s.xp}XP ${engine.emotionEmoji}\n` +
            `H:${s.needs.hunger}/100  E:${s.needs.energy}/100  😊:${s.needs.happiness}/100\n` +
            `输入 /pets info 查看详细档案，/pets help 查看全部命令`,
            'info',
          );
          break;
        }

        // ---- import ----
        case 'import': {
          const pathArg = parts[1];
          if (!pathArg) {
            ctx.ui.notify('请指定宠物目录路径：/pets import <path>', 'warning');
            return;
          }
          try {
            const result = await importPet(pathArg);

            // Same species — refresh cache only, keep state
            if (engine.hasPet && engine.state!.bones.species === result.speciesId) {
              await reloadPet(result.speciesId);
              engine.setBubble(getRandomBubble('excited'));
              ctx.ui.setStatus('pet', buildFooterStatus(engine));
              ctx.ui.notify(`💄 ${result.displayName} 的外观已更新！`, 'info');
              return;
            }

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

        // ---- list ----
        case 'list': {
          try {
            const cached = await listCachedSpecies();
            if (cached.length === 0) {
              ctx.ui.notify('还没有导入过宠物。使用 /pets import <path> 导入一只', 'info');
              return;
            }
            const lines = cached.map((c) => `${c.emoji} ${c.displayName} (${c.speciesId})`);
            ctx.ui.notify('已导入的宠物:\n' + lines.join('\n'), 'info');
          } catch (err) {
            ctx.ui.notify('列出宠物失败: ' + (err as Error).message, 'error');
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

          // Gather species/rarity/stage info for feedback
          const s = engine.state!;
          const sp = getSpecies(s.bones.species);
          const shinyMark = s.bones.isShiny ? ' ✨' : '';
          const rarityMap: Record<string, string> = {
            common: '普通', uncommon: '稀有', rare: '精良', epic: '史诗', legendary: '传说',
          };
          const rarityLabel = rarityMap[s.bones.rarity] ?? s.bones.rarity;

          ctx.ui.notify(
            `🐣 孵化成功！欢迎 "${s.name}"\n` +
            `${sp.emoji} ${sp.name} · ${rarityLabel}${shinyMark} · ${engine.stageName}`,
            'info',
          );

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

        // ---- info ----
        case 'info': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('还没有宠物！使用 /pets hatch 孵化一只', 'warning');
            return;
          }
          const s = engine.state;
          const sp = getSpecies(s.bones.species);
          const shinyMark = s.bones.isShiny ? '✨ ' : '';
          const genderMark = s.bones.gender === 'male' ? '♂' : '♀';
          const rarityMap: Record<string, string> = {
            common: '普通', uncommon: '稀有', rare: '精良', epic: '史诗', legendary: '传说',
          };
          const rarityLabel = rarityMap[s.bones.rarity] ?? s.bones.rarity;
          const stats = s.bones.baseStats;
          const skillInfo = s.unlockedSkills.length > 0
            ? `已解锁: ${s.unlockedSkills.join(', ')}` + (s.equippedSkills.length > 0 ? ` | 已装备: ${s.equippedSkills.join(', ')}` : '')
            : '无 (未解锁)';
          const createdDate = new Date(s.createdAt).toLocaleDateString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
          });

          ctx.ui.notify(
            `"${s.name}" — ${sp.emoji} ${sp.name}\n` +
            `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n` +
            `${rarityLabel}${shinyMark}${genderMark} · ${sp.domain}\n` +
            `Lv.${s.level} ${engine.stageName} · ⭐${s.xp}XP\n` +
            `H:${s.needs.hunger}  E:${s.needs.energy}  😊:${s.needs.happiness}  ${engine.emotionEmoji}\n` +
            `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n` +
            `debug:${stats.debugging}  pat:${stats.patience}  chaos:${stats.chaos}\n` +
            `wisdom:${stats.wisdom}  snark:${stats.snark}\n` +
            `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n` +
            `个性: ${sp.description}\n` +
            `技能: ${skillInfo}\n` +
            `会话:${s.totalSessions} 错误:${s.totalErrors} 测试:${s.totalTestsPassed}\n` +
            `创建于: ${createdDate}`,
            'info',
          );
          break;
        }

        // ---- pet (pet) ----
        case 'pet': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          const beforeHappiness = engine.state.needs.happiness;
          engine.doPet();
          const afterHappiness = engine.state.needs.happiness;
          const actualGain = afterHappiness - beforeHappiness;
          const xpAmount = xpFromPetCommand();
          engine.addXp(xpAmount);
          engine.setBubble('嗯～好舒服～');
          setAnimationOverride('play', 2000);
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(
            `你摸了摸宠物，它很开心！ +${actualGain}😊 (${beforeHappiness}→${afterHappiness}) +${xpAmount}XP`,
            'info',
          );
          break;
        }

        // ---- feed ----
        case 'feed': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          const beforeHunger = engine.state.needs.hunger;
          engine.doFeed();
          const afterHunger = engine.state.needs.hunger;
          const actualGain = afterHunger - beforeHunger;
          const xpAmount = xpFromFeedCommand();
          engine.addXp(xpAmount);
          engine.setBubble('好吃！谢谢～');
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(
            `宠物吃饱了！ +${actualGain}H (${beforeHunger}→${afterHunger}) +${xpAmount}XP`,
            'info',
          );
          break;
        }

        // ---- name (alias: kept for backward compat) ----
        case 'name':
        // ---- rename (primary) ----
        case 'rename': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          const newName = parts.slice(1).join(' ');
          if (!newName) {
            ctx.ui.notify('请提供新名称：/pets rename <新名字>', 'warning');
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
          if (!engine.hasPet || !engine.state) {
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
          const s = engine.state;
          const sp = getSpecies(s.bones.species);
          await engine.release();
          ctx.ui.setStatus('pet', undefined);
          ctx.ui.notify(`"${name}" (${sp.emoji} ${sp.name} Lv.${s.level}) 已放生。一路走好...`, 'info');
          break;
        }

        // ---- delete (alias: kept for backward compat - strong delete) ----
        case 'delete': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('还没有宠物！', 'warning');
            return;
          }
          const confirmed = await ctx.ui.confirm(
            '删除宠物',
            `确定要删除 "${engine.petName}" 及其所有数据吗？此操作不可撤销！`,
          );
          if (!confirmed) {
            ctx.ui.notify('删除已取消', 'info');
            return;
          }
          const speciesId = engine.state!.bones.species;
          const name = engine.petName;
          await engine.release();
          await invalidateCache(speciesId);
          unloadPet(speciesId);
          ctx.ui.setStatus('pet', undefined);
          ctx.ui.notify(`"${name}" 及其数据已删除。`, 'info');
          return;
        }

        // ---- clean ----
        case 'clean': {
          let speciesArg = parts[1];

          // No argument: clean current pet's species, or show hint
          if (!speciesArg) {
            if (engine.hasPet && engine.state) {
              speciesArg = engine.state.bones.species;
              // Confirm since this will clear the current pet's art cache
              const confirmed = await ctx.ui.confirm(
                '清理缓存',
                `将清除当前宠物 (${engine.petName}) 的图像缓存。宠物数据会保留，但图像需要重新导入。确定？`,
              );
              if (!confirmed) {
                ctx.ui.notify('清理已取消', 'info');
                return;
              }
            } else {
              ctx.ui.notify('没有指定物种。使用 /pets clean <speciesId> 清理指定物种缓存，或先孵化/导入一只宠物后使用 /pets clean 清理当前宠物。', 'warning');
              return;
            }
          }

          // Check cache exists before attempting clean
          if (!hasCache(speciesArg)) {
            ctx.ui.notify(`未找到物种 "${speciesArg}" 的图像缓存`, 'warning');
            return;
          }

          // If cleaning current pet's species with explicit arg, warn
          if (engine.hasPet && engine.state && engine.state.bones.species === speciesArg && parts[1]) {
            const confirmed = await ctx.ui.confirm(
              '清理缓存',
              `"${speciesArg}" 是当前宠物的物种。清理后图像将消失，但宠物数据会保留。确定？`,
            );
            if (!confirmed) {
              ctx.ui.notify('清理已取消', 'info');
              return;
            }
          }

          try {
            await invalidateCache(speciesArg);
            unloadPet(speciesArg);
            ctx.ui.notify(`✨ "${speciesArg}" 的图像缓存已清除`, 'info');
          } catch (err) {
            ctx.ui.notify('清理失败: ' + (err as Error).message, 'error');
          }
          return;
        }

        // ---- help ----
        case 'help': {
          ctx.ui.notify(
            '/pets 宠物系统命令\n' +
            '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n' +
            'hatch [seed]     孵化新宠物（可选 seed）\n' +
            'status           显示宠物面板（全屏 widget）\n' +
            'info             查看宠物详细档案\n' +
            'list             列出已导入的宠物\n' +
            'pet              抚摸宠物（+快乐 +XP）\n' +
            'feed             喂食宠物（+饥饿 +XP）\n' +
            'rename <name>    给宠物改名\n' +
            'toggle           显示/隐藏宠物面板\n' +
            'release          放生当前宠物（不可撤销）\n' +
            'import <path>    导入精灵图宠物\n' +
            'clean [species]  清理图像缓存（无参时清理当前宠物）\n' +
            'help             显示本帮助',
            'info',
          );
          break;
        }

        // ---- unknown / fallback ----
        default: {
          // Show pet summary if there's a pet, otherwise show guidance
          if (engine.hasPet && engine.state) {
            const s = engine.state;
            const sp = getSpecies(s.bones.species);
            ctx.ui.notify(
              `未知子命令 "${sub}"。输入 /pets help 查看全部命令。\n` +
              `当前宠物: "${s.name}" ${sp.emoji} Lv.${s.level} ${engine.stageName} ${engine.emotionEmoji}`,
              'warning',
            );
          } else {
            ctx.ui.notify(
              `未知子命令 "${sub}"。使用 /pets hatch [seed] 孵化宠物，或 /pets help 查看全部命令。`,
              'warning',
            );
          }
          break;
        }
      }
    },
  });
}
