import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PetEngine } from './pet_instance.ts';
import type { PetState } from './types.ts';
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
    description: '\u5BA0\u7269\u7CFB\u7EDF - \u67E5\u770B/\u9972\u517B\u4F60\u7684\u7F16\u7801\u4F19\u4F34',
    getArgumentCompletions: (prefix: string) => {
      const subcommands: Array<{ value: string; label: string; description: string }> = [
        { value: 'hatch',   label: 'hatch',   description: '\u968F\u673A\u5B75\u5316\u4E00\u53EA\u65B0\u5BA0\u7269' },
        { value: 'status',  label: 'status',  description: '\u663E\u793A\u5BA0\u7269\u9762\u677F' },
        { value: 'info',    label: 'info',    description: '\u67E5\u770B\u5BA0\u7269\u8BE6\u7EC6\u6863\u6848' },
{ value: 'list',    label: 'list',    description: '列出已孵化宠物并交互切换' },
        { value: 'pet',     label: 'pet',     description: '\u629A\u6478\u5BA0\u7269\uFF0C\u5B83\u4F1A\u5F88\u5F00\u5FC3' },
        { value: 'feed',    label: 'feed',    description: '\u5582\u98DF\u5BA0\u7269' },
        { value: 'rename',  label: 'rename',  description: '\u7ED9\u5BA0\u7269\u6539\u540D' },
        { value: 'toggle',  label: 'toggle',  description: '\u663E\u793A/\u9690\u85CF\u5BA0\u7269\u9762\u677F' },
        { value: 'release', label: 'release', description: '\u653E\u751F\u5F53\u524D\u5BA0\u7269\uFF08\u4E0D\u53EF\u64A4\u9500\uFF09' },
        { value: 'import',  label: 'import',  description: '\u5BFC\u5165\u7CBE\u7075\u56FE\u5BA0\u7269' },
        { value: 'clean',   label: 'clean',   description: '\u6E05\u9664\u6307\u5B9A\u5BA0\u7269\u7684\u56FE\u50CF\u7F13\u5B58' },
        { value: 'help',    label: 'help',    description: '\u663E\u793A\u5168\u90E8\u547D\u4EE4\u5E2E\u52A9' },
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
              '\u8FD8\u6CA1\u6709\u5BA0\u7269\uFF01\u4F7F\u7528 /pets hatch \u968F\u673A\u5B75\u5316\u4E00\u53EA\uFF0C\u6216 /pets import <path> \u5BFC\u5165\u7269\u79CD\u3002\u8F93\u5165 /pets help \u67E5\u770B\u5168\u90E8\u547D\u4EE4\u3002',
              'info',
            );
            return;
          }
          const s = engine.state!;
          const sp = getSpecies(s.bones.species);
          const shinyMark = s.bones.isShiny ? ' \u2728' : '';
          const genderMark = s.bones.gender === 'male' ? '\u2642' : '\u2640';
          ctx.ui.notify(
            `"${s.name}" \u2014 ${sp.emoji} ${sp.name} (${engine.rarityLabel}${shinyMark} ${genderMark})\n` +
            `Lv.${s.level} ${engine.stageName} \u2B50${s.xp}XP ${engine.emotionEmoji}\n` +
            `H:${s.needs.hunger}/100  E:${s.needs.energy}/100  \u{1F60A}:${s.needs.happiness}/100\n` +
            `\u8F93\u5165 /pets info \u67E5\u770B\u8BE6\u7EC6\u6863\u6848\uFF0C/pets help \u67E5\u770B\u5168\u90E8\u547D\u4EE4`,
            'info',
          );
          break;
        }

        // ---- import (only adds species, does NOT hatch) ----
        case 'import': {
          const pathArg = parts[1];
          if (!pathArg) {
            ctx.ui.notify('\u8BF7\u6307\u5B9A\u5BA0\u7269\u76EE\u5F55\u8DEF\u5F84\uFF1A/pets import <path>', 'warning');
            return;
          }
          try {
            const result = await importPet(pathArg);

            // Same species — refresh cache only, keep state
            if (engine.hasPet && engine.state!.bones.species === result.speciesId) {
              await reloadPet(result.speciesId);
              engine.setBubble(getRandomBubble('excited'));
              ctx.ui.setStatus('pet', buildFooterStatus(engine));
              ctx.ui.notify(`\u{1F484} ${result.displayName} \u7684\u5916\u89C2\u5DF2\u66F4\u65B0\uFF01`, 'info');
              return;
            }

            // Just imported — preload frames
            await loadPet(result.speciesId);

            engine.setBubble('\u{1F4E6} \u65B0\u7269\u79CD\u5DF2\u52A0\u5165\u56FE\u9274\uFF01');
            ctx.ui.setStatus('pet', buildFooterStatus(engine));
            ctx.ui.notify(
              `\u{1F4E6} \u5DF2\u5BFC\u5165 "${result.displayName}" (${result.speciesId})\n` +
              `使用 /pets hatch 随机孵化该物种`, 'info',
            );
          } catch (err) {
            ctx.ui.notify('\u5BFC\u5165\u5931\u8D25: ' + (err as Error).message, 'error');
          }
          return;
        }


        // ---- list (native select, only hatched pets) ----
        case 'list': {
          try {
            const allPets = await engine.listAllPets();
            if (allPets.length === 0) {
              ctx.ui.notify(
                '\u8FD8\u6CA1\u6709\u5B75\u5316\u7684\u5BA0\u7269\u3002\u8BF7\u4F7F\u7528 /pets hatch \u5B75\u5316\u4E00\u53EA\u65B0\u5BA0\u7269\u3002',
                'info',
              );
              return;
            }

            // Build clean display labels + lookup map
            const labelToPet = new Map<string, PetState>();
            const labels: string[] = [];

            for (const pet of allPets) {
              const sp = getSpecies(pet.bones.species);
              const isCurrent = engine.hasPet && engine.state!.id === pet.id;
              const name = pet.name.replace(/[\x00-\x1F\x7F]/g, '').trim() || pet.bones.species;
              const label = isCurrent
                ? `\u{1F4A1} ${sp.emoji} ${name} (${pet.bones.species}) Lv.${pet.level} \u2190 \u5F53\u524D`
                : `${sp.emoji} ${name} (${pet.bones.species}) Lv.${pet.level}`;
              labelToPet.set(label, pet);
              labels.push(label);
            }

            // Sort: current first, then by label
            labels.sort((a, b) => {
              if (a.includes('\u2190 \u5F53\u524D')) return -1;
              if (b.includes('\u2190 \u5F53\u524D')) return 1;
              return a.localeCompare(b);
            });

            const selected = await ctx.ui.select('\u5BA0\u7269\u5217\u8868', labels);

            if (!selected) {
              ctx.ui.notify('\u5DF2\u53D6\u6D88', 'info');
              if (overlayControls?.isOverlayVisible()) overlayControls.showOverlay();
              return;
            }

            const targetPet = labelToPet.get(selected);
            if (!targetPet) {
              ctx.ui.notify('\u9009\u62E9\u65E0\u6548', 'warning');
              return;
            }

            if (engine.hasPet && engine.state!.id === targetPet.id) {
              ctx.ui.notify('\u5DF2\u662F\u5F53\u524D\u5BA0\u7269\u3002', 'info');
              if (overlayControls?.isOverlayVisible()) overlayControls.showOverlay();
              return;
            }

            await engine.switchToPet(targetPet);
            const sp = getSpecies(targetPet.bones.species);
            ctx.ui.notify(
              `\u2705 \u5DF2\u5207\u6362\u5230 "${targetPet.name}" (${sp.emoji} ${sp.name} Lv.${targetPet.level})`,
              'info',
            );
            engine.setBubble('\u6211\u56DE\u6765\u5566\uFF01');
            ctx.ui.setStatus('pet', buildFooterStatus(engine));
            if (overlayControls?.isOverlayVisible()) overlayControls.showOverlay();
          } catch (err) {
            ctx.ui.notify('\u5217\u51FA\u5BA0\u7269\u5931\u8D25: ' + (err as Error).message, 'error');
          }
          return;
        }

        // ---- hatch ----
        case 'hatch': {
          // Check if there are any imported species
          const available = await listCachedSpecies();
          if (available.length === 0) {
            ctx.ui.notify(
              '\u8FD8\u6CA1\u6709\u53EF\u5B75\u5316\u7684\u7269\u79CD\u3002\u8BF7\u5148\u4F7F\u7528 /pets import <path> \u5BFC\u5165\u4E00\u4E2A\u5BA0\u7269\u7269\u79CD\u3002',
              'warning',
            );
            return;
          }

          if (engine.hasPet) {
            const confirmed = await ctx.ui.confirm(
              '\u5DF2\u6709\u5BA0\u7269',
              `\u5F53\u524D\u6709\u5BA0\u7269 "${engine.petName}"\u3002\u5B75\u5316\u65B0\u5BA0\u7269\u4F1A\u4FDD\u7559\u65E7\u5BA0\u7269\u6570\u636E\uFF0C\u53EA\u662F\u5207\u6362\u5230\u65B0\u5BA0\u7269\u3002\u786E\u5B9A\uFF1F`,
            );
            if (!confirmed) {
              ctx.ui.notify('\u5B75\u5316\u5DF2\u53D6\u6D88', 'info');
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

          // Pick a random species from imported cache
          const prng = (await import('./prng.ts')).createPrng(seed + 1);
          const picked = prng.pick(available);
          const speciesId = picked.speciesId;

          await engine.hatch(seed, speciesId);

          // Preload frames
          await loadPet(speciesId);

          const s = engine.state!;
          const sp = getSpecies(s.bones.species);
          const shinyMark = s.bones.isShiny ? ' \u2728' : '';
          const rarityMap: Record<string, string> = {
            common: '\u666E\u901A', uncommon: '\u7A00\u6709', rare: '\u7CBE\u826F', epic: '\u53F2\u8BD7', legendary: '\u4F20\u8BF4',
          };
          const rarityLabel = rarityMap[s.bones.rarity] ?? s.bones.rarity;

          ctx.ui.notify(
            `\u{1F423} \u5B75\u5316\u6210\u529F\uFF01\u6B22\u8FCE "${s.name}"\n` +
            `${sp.emoji} ${sp.name} \u00B7 ${rarityLabel}${shinyMark} \u00B7 ${engine.stageName}`,
            'info',
          );

          engine.setBubble(getRandomBubble('excited'));
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          break;
        }

        // ---- status ----
        case 'status': {
          if (!engine.hasPet) {
            ctx.ui.notify('\u8FD8\u6CA1\u6709\u5BA0\u7269\uFF01\u4F7F\u7528 /pets hatch \u968F\u673A\u5B75\u5316\u4E00\u53EA', 'warning');
            return;
          }
          overlayControls?.showOverlay();
          ctx.ui.notify('\u5BA0\u7269\u9762\u677F\u5DF2\u663E\u793A', 'info');
          break;
        }

        // ---- info ----
        case 'info': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('\u8FD8\u6CA1\u6709\u5BA0\u7269\uFF01\u4F7F\u7528 /pets hatch \u968F\u673A\u5B75\u5316\u4E00\u53EA', 'warning');
            return;
          }
          const s = engine.state;
          const sp = getSpecies(s.bones.species);
          const shinyMark = s.bones.isShiny ? '\u2728 ' : '';
          const genderMark = s.bones.gender === 'male' ? '\u2642' : '\u2640';
          const rarityMap: Record<string, string> = {
            common: '\u666E\u901A', uncommon: '\u7A00\u6709', rare: '\u7CBE\u826F', epic: '\u53F2\u8BD7', legendary: '\u4F20\u8BF4',
          };
          const rarityLabel = rarityMap[s.bones.rarity] ?? s.bones.rarity;
          const stats = s.bones.baseStats;
          const skillInfo = s.unlockedSkills.length > 0
            ? `\u5DF2\u89E3\u9501: ${s.unlockedSkills.join(', ')}` + (s.equippedSkills.length > 0 ? ` | \u5DF2\u88C5\u5907: ${s.equippedSkills.join(', ')}` : '')
            : '\u65E0 (\u672A\u89E3\u9501)';
          const createdDate = new Date(s.createdAt).toLocaleDateString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
          });

          ctx.ui.notify(
            `"${s.name}" \u2014 ${sp.emoji} ${sp.name}\n` +
            `\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\n` +
            `${rarityLabel}${shinyMark}${genderMark} \u00B7 ${sp.domain}\n` +
            `Lv.${s.level} ${engine.stageName} \u00B7 \u2B50${s.xp}XP\n` +
            `H:${s.needs.hunger}  E:${s.needs.energy}  \u{1F60A}:${s.needs.happiness}  ${engine.emotionEmoji}\n` +
            `\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\n` +
            `debug:${stats.debugging}  pat:${stats.patience}  chaos:${stats.chaos}\n` +
            `wisdom:${stats.wisdom}  snark:${stats.snark}\n` +
            `\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\n` +
            `\u4E2A\u6027: ${sp.description}\n` +
            `\u6280\u80FD: ${skillInfo}\n` +
            `\u4F1A\u8BDD:${s.totalSessions} \u9519\u8BEF:${s.totalErrors} \u6D4B\u8BD5:${s.totalTestsPassed}\n` +
            `\u521B\u5EFA\u4E8E: ${createdDate}`,
            'info',
          );
          break;
        }

        // ---- pet (pet) ----
        case 'pet': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('\u8FD8\u6CA1\u6709\u5BA0\u7269\uFF01', 'warning');
            return;
          }
          const beforeHappiness = engine.state.needs.happiness;
          engine.doPet();
          const afterHappiness = engine.state.needs.happiness;
          const actualGain = afterHappiness - beforeHappiness;
          const xpAmount = xpFromPetCommand();
          engine.addXp(xpAmount);
          engine.setBubble('\u55EF\uFF5E\u597D\u8212\u670D\uFF5E');
          setAnimationOverride('play', 2000);
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(
            `\u4F60\u6478\u4E86\u6478\u5BA0\u7269\uFF0C\u5B83\u5F88\u5F00\u5FC3\uFF01 +${actualGain}\u{1F60A} (${beforeHappiness}\u2192${afterHappiness}) +${xpAmount}XP`,
            'info',
          );
          break;
        }

        // ---- feed ----
        case 'feed': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('\u8FD8\u6CA1\u6709\u5BA0\u7269\uFF01', 'warning');
            return;
          }
          const beforeHunger = engine.state.needs.hunger;
          engine.doFeed();
          const afterHunger = engine.state.needs.hunger;
          const actualGain = afterHunger - beforeHunger;
          const xpAmount = xpFromFeedCommand();
          engine.addXp(xpAmount);
          engine.setBubble('\u597D\u5403\uFF01\u8C22\u8C22\uFF5E');
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(
            `\u5BA0\u7269\u5403\u9971\u4E86\uFF01 +${actualGain}H (${beforeHunger}\u2192${afterHunger}) +${xpAmount}XP`,
            'info',
          );
          break;
        }

        // ---- name (alias: kept for backward compat) ----
        case 'name':
        // ---- rename (primary) ----
        case 'rename': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('\u8FD8\u6CA1\u6709\u5BA0\u7269\uFF01', 'warning');
            return;
          }
          const newName = parts.slice(1).join(' ');
          if (!newName) {
            ctx.ui.notify('\u8BF7\u63D0\u4F9B\u65B0\u540D\u79F0\uFF1A/pets rename <\u65B0\u540D\u5B57>', 'warning');
            return;
          }
          const sanitized = newName.replace(/[\x00-\x1F\x7F]/g, '').trim();
          if (!sanitized || sanitized.length > 32) {
            ctx.ui.notify('\u540D\u79F0\u957F\u5EA6\u9700\u5728 1-32 \u5B57\u7B26\u4E4B\u95F4\uFF0C\u4E14\u4E0D\u80FD\u5305\u542B\u63A7\u5236\u5B57\u7B26', 'warning');
            return;
          }
          engine.state!.name = sanitized;
          engine.setBubble(`\u73B0\u5728\u6211\u53EB ${sanitized}\uFF01`);
          await engine.save();
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(`\u5BA0\u7269\u5DF2\u91CD\u547D\u540D\u4E3A "${sanitized}"`, 'info');
          break;
        }

        // ---- toggle (hide/show overlay) ----
        case 'toggle': {
          const isVisible = overlayControls?.toggleOverlay() ?? false;
          ctx.ui.notify(isVisible ? '\u{1F43E} \u5BA0\u7269\u9762\u677F\u5DF2\u663E\u793A' : '\u{1F648} \u5BA0\u7269\u9762\u677F\u5DF2\u9690\u85CF', 'info');
          break;
        }

        // ---- release ----
        case 'release': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('\u8FD8\u6CA1\u6709\u5BA0\u7269\uFF01', 'warning');
            return;
          }
          const confirmed = await ctx.ui.confirm(
            '\u653E\u751F\u5BA0\u7269',
            `\u786E\u5B9A\u8981\u653E\u751F "${engine.petName}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\uFF01`,
          );
          if (!confirmed) {
            ctx.ui.notify('\u653E\u751F\u5DF2\u53D6\u6D88', 'info');
            return;
          }
          const name = engine.petName;
          const s = engine.state;
          const sp = getSpecies(s.bones.species);
          await engine.release();
          ctx.ui.setStatus('pet', undefined);
          ctx.ui.notify(`"${name}" (${sp.emoji} ${sp.name} Lv.${s.level}) \u5DF2\u653E\u751F\u3002\u4E00\u8DEF\u8D70\u597D...`, 'info');
          break;
        }

        // ---- delete (alias: kept for backward compat - strong delete) ----
        case 'delete': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify('\u8FD8\u6CA1\u6709\u5BA0\u7269\uFF01', 'warning');
            return;
          }
          const confirmed = await ctx.ui.confirm(
            '\u5220\u9664\u5BA0\u7269',
            `\u786E\u5B9A\u8981\u5220\u9664 "${engine.petName}" \u53CA\u5176\u6240\u6709\u6570\u636E\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\uFF01`,
          );
          if (!confirmed) {
            ctx.ui.notify('\u5220\u9664\u5DF2\u53D6\u6D88', 'info');
            return;
          }
          const speciesId = engine.state!.bones.species;
          const name = engine.petName;
          await engine.release();
          await invalidateCache(speciesId);
          unloadPet(speciesId);
          ctx.ui.setStatus('pet', undefined);
          ctx.ui.notify(`"${name}" \u53CA\u5176\u6570\u636E\u5DF2\u5220\u9664\u3002`, 'info');
          return;
        }

        // ---- clean ----
        case 'clean': {
          let speciesArg = parts[1];

          // No argument: clean current pet's species, or show hint
          if (!speciesArg) {
            if (engine.hasPet && engine.state) {
              speciesArg = engine.state.bones.species;
              const confirmed = await ctx.ui.confirm(
                '\u6E05\u7406\u7F13\u5B58',
                `\u5C06\u6E05\u9664\u5F53\u524D\u5BA0\u7269 (${engine.petName}) \u7684\u56FE\u50CF\u7F13\u5B58\u3002\u5BA0\u7269\u6570\u636E\u4F1A\u4FDD\u7559\uFF0C\u4F46\u56FE\u50CF\u9700\u8981\u91CD\u65B0\u5BFC\u5165\u3002\u786E\u5B9A\uFF1F`,
              );
              if (!confirmed) {
                ctx.ui.notify('\u6E05\u7406\u5DF2\u53D6\u6D88', 'info');
                return;
              }
            } else {
              ctx.ui.notify('\u6CA1\u6709\u6307\u5B9A\u7269\u79CD\u3002\u4F7F\u7528 /pets clean <speciesId> \u6E05\u7406\u6307\u5B9A\u7269\u79CD\u7F13\u5B58\uFF0C\u6216\u5148\u5B75\u5316/\u5BFC\u5165\u4E00\u53EA\u5BA0\u7269\u540E\u4F7F\u7528 /pets clean \u6E05\u7406\u5F53\u524D\u5BA0\u7269\u3002', 'warning');
              return;
            }
          }

          if (!hasCache(speciesArg)) {
            ctx.ui.notify(`\u672A\u627E\u5230\u7269\u79CD "${speciesArg}" \u7684\u56FE\u50CF\u7F13\u5B58`, 'warning');
            return;
          }

          if (engine.hasPet && engine.state && engine.state.bones.species === speciesArg && parts[1]) {
            const confirmed = await ctx.ui.confirm(
              '\u6E05\u7406\u7F13\u5B58',
              `"${speciesArg}" \u662F\u5F53\u524D\u5BA0\u7269\u7684\u7269\u79CD\u3002\u6E05\u7406\u540E\u56FE\u50CF\u5C06\u6D88\u5931\uFF0C\u4F46\u5BA0\u7269\u6570\u636E\u4F1A\u4FDD\u7559\u3002\u786E\u5B9A\uFF1F`,
            );
            if (!confirmed) {
              ctx.ui.notify('\u6E05\u7406\u5DF2\u53D6\u6D88', 'info');
              return;
            }
          }

          try {
            await invalidateCache(speciesArg);
            unloadPet(speciesArg);
            ctx.ui.notify(`\u2728 "${speciesArg}" \u7684\u56FE\u50CF\u7F13\u5B58\u5DF2\u6E05\u9664`, 'info');
          } catch (err) {
            ctx.ui.notify('\u6E05\u7406\u5931\u8D25: ' + (err as Error).message, 'error');
          }
          return;
        }

        // ---- help ----
        case 'help': {
          ctx.ui.notify(
            '/pets \u5BA0\u7269\u7CFB\u7EDF\u547D\u4EE4\n' +
            '\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\u2508\n' +
            'hatch [seed]     \u4ECE\u5DF2\u5BFC\u5165\u7269\u79CD\u4E2D\u968F\u673A\u5B75\u5316\u65B0\u5BA0\u7269\n' +
            'status           \u663E\u793A\u5BA0\u7269\u9762\u677F\uFF08\u5168\u5C4F widget\uFF09\n' +
            'info             \u67E5\u770B\u5BA0\u7269\u8BE6\u7EC6\u6863\u6848\n' +
            'list             列出已孵化宠物并交互切换\n' +
            'pet              \u629A\u6478\u5BA0\u7269\uFF08+\u5FEB\u4E50 +XP\uFF09\n' +
            'feed             \u5582\u98DF\u5BA0\u7269\uFF08+\u9965\u997F +XP\uFF09\n' +
            'rename <name>    \u7ED9\u5BA0\u7269\u6539\u540D\n' +
            'toggle           \u663E\u793A/\u9690\u85CF\u5BA0\u7269\u9762\u677F\n' +
            'release          \u653E\u751F\u5F53\u524D\u5BA0\u7269\uFF08\u4E0D\u53EF\u64A4\u9500\uFF09\n' +
            'import <path>    \u5BFC\u5165\u7CBE\u7075\u56FE\u5BA0\u7269\uFF08\u4EC5\u6DFB\u52A0\u7269\u79CD\uFF0C\u4E0D\u5B75\u5316\uFF09\n' +
            'clean [species]  \u6E05\u7406\u56FE\u50CF\u7F13\u5B58\uFF08\u65E0\u53C2\u65F6\u6E05\u7406\u5F53\u524D\u5BA0\u7269\uFF09\n' +
            'help             \u663E\u793A\u672C\u5E2E\u52A9',
            'info',
          );
          break;
        }

        // ---- unknown / fallback ----
        default: {
          if (engine.hasPet && engine.state) {
            const s = engine.state;
            const sp = getSpecies(s.bones.species);
            ctx.ui.notify(
              `\u672A\u77E5\u5B50\u547D\u4EE4 "${sub}"\u3002\u8F93\u5165 /pets help \u67E5\u770B\u5168\u90E8\u547D\u4EE4\u3002\n` +
              `\u5F53\u524D\u5BA0\u7269: "${s.name}" ${sp.emoji} Lv.${s.level} ${engine.stageName} ${engine.emotionEmoji}`,
              'warning',
            );
          } else {
            ctx.ui.notify(
              `\u672A\u77E5\u5B50\u547D\u4EE4 "${sub}"\u3002\u4F7F\u7528 /pets hatch \u5B75\u5316\u5BA0\u7269\uFF0C\u6216 /pets help \u67E5\u770B\u5168\u90E8\u547D\u4EE4\u3002`,
              'warning',
            );
          }
          break;
        }
      }
    },
  });
}
