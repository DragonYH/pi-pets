import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PetEngine } from './pet_instance.js';
import type { PetState } from './types.js';
import { buildFooterStatus } from './ui/footer.js';
import { getRandomBubble } from './ui/bubbles.js';
import { hashString } from './prng.js';
import { xpFromPetCommand, xpFromFeedCommand } from './xp.js';
import { importPet } from './renderer/importer.js';
import { loadPet, setAnimationOverride, unloadPet, reloadPet } from './renderer/art-provider.js';
import { invalidateCache, listCachedSpecies, hasCache } from './renderer/cache.js';
import { getSpecies } from './species.js';
import { t, setLanguage, getLanguage, getSupportedLanguages } from './i18n/index.js';

export function registerCommands(
  pi: ExtensionAPI,
  engine: PetEngine,
  overlayControls?: {
    showOverlay: () => void;
    hideOverlay: () => void;
    toggleOverlay: () => boolean;
    isOverlayVisible: () => boolean;
    startTicking?: () => void;
  },
) {

  // ===== Commands =====

  pi.registerCommand('pets', {
    description: t('cmd_pets_desc'),
    getArgumentCompletions: (prefix: string) => {
      const subcommands: Array<{ value: string; label: string; description: string }> = [
        { value: 'hatch',   label: 'hatch',   description: t('cmd_hatch_desc') },
        { value: 'info',    label: 'info',    description: t('cmd_info_desc') },
        { value: 'list',    label: 'list',    description: t('cmd_list_desc') },
        { value: 'pet',     label: 'pet',     description: t('cmd_pet_desc') },
        { value: 'feed',    label: 'feed',    description: t('cmd_feed_desc') },
        { value: 'rename',  label: 'rename',  description: t('cmd_rename_desc') },
        { value: 'ui',      label: 'ui',      description: t('cmd_ui_desc') },
        { value: 'release', label: 'release', description: t('cmd_release_desc') },
        { value: 'import',  label: 'import',  description: t('cmd_import_desc') },
        { value: 'clean',   label: 'clean',   description: t('cmd_clean_desc') },
        { value: 'delete',  label: 'delete',  description: t('cmd_delete_desc') },
        { value: 'lang',    label: 'lang',    description: t('cmd_lang_desc') },
        { value: 'help',    label: 'help',    description: t('cmd_help_desc') },
      ];

      // Handle "lang <zh-CN|en>" completion
      if (prefix.trim().startsWith('lang ')) {
        const partial = prefix.trim().slice('lang '.length);
        const langs = getSupportedLanguages();
        return langs
          .filter((l) => l.startsWith(partial))
          .map((l) => ({ value: `lang ${l}`, label: `lang ${l}`, insertValue: `lang ${l}`, description: `Switch to ${l}` }));
      }

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
          ctx.ui.notify(
            t('help_title') + '\n' +
            t('help_separator') + '\n' +
            t('help_hatch') + '\n' +
            t('help_info') + '\n' +
            t('help_list') + '\n' +
            t('help_pet') + '\n' +
            t('help_feed') + '\n' +
            t('help_rename') + '\n' +
            t('help_ui') + '\n' +
            t('help_release') + '\n' +
            t('help_import') + '\n' +
            t('help_clean') + '\n' +
            t('help_delete') + '\n' +
            t('help_lang') + '\n' +
            t('help_help'),
            'info',
          );
          break;
        }

        // ---- lang <zh-CN|en> — switch language ----
        case 'lang': {
          const langArg = parts.slice(1).join(' ').trim();
          if (langArg === 'zh-cn' || langArg === 'zh' || langArg === 'cn') {
            setLanguage('zh-CN');
            ctx.ui.notify(t('notify_lang_switched_zh'), 'info');
          } else if (langArg === 'en' || langArg === 'english') {
            setLanguage('en');
            ctx.ui.notify(t('notify_lang_switched_en'), 'info');
          } else {
            ctx.ui.notify(t('notify_lang_unsupported', { lang: langArg || '' }), 'warning');
          }
          break;
        }

        // ---- import (only adds species, does NOT hatch) ----
        case 'import': {
          const pathArg = parts[1];
          if (!pathArg) {
            ctx.ui.notify(t('notify_need_path'), 'warning');
            return;
          }
          try {
            const result = await importPet(pathArg);

            // Same species — refresh cache only, keep state
            if (engine.hasPet && engine.state!.bones.species === result.speciesId) {
              await reloadPet(result.speciesId);
              engine.setBubble(getRandomBubble('excited'));
              ctx.ui.setStatus('pet', buildFooterStatus(engine));
              ctx.ui.notify(t('event_import_appearance', { displayName: result.displayName }), 'info');
              return;
            }

            // Just imported — preload frames
            await loadPet(result.speciesId);

            engine.setBubble(t('event_new_species'));
            ctx.ui.setStatus('pet', buildFooterStatus(engine));
            ctx.ui.notify(
              t('notify_imported', { displayName: result.displayName, speciesId: result.speciesId }) + '\n' +
              t('notify_import_hint'), 'info',
            );
          } catch (err) {
            ctx.ui.notify(t('notify_import_failed', { message: (err as Error).message }), 'error');
          }
          return;
        }


        // ---- list (native select, only hatched pets) ----
        case 'list': {
          try {
            const allPets = await engine.listAllPets();
            if (allPets.length === 0) {
              ctx.ui.notify(
                t('notify_already_hatched'),
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
                ? `💡 ${sp.emoji} ${name} (${pet.bones.species}) Lv.${pet.level} ← ${t('widget_current_label')}`
                : `${sp.emoji} ${name} (${pet.bones.species}) Lv.${pet.level}`;
              labelToPet.set(label, pet);
              labels.push(label);
            }

            // Sort: current first, then by label
            labels.sort((a, b) => {
              if (a.includes('←')) return -1;
              if (b.includes('←')) return 1;
              return a.localeCompare(b);
            });

            const selected = await ctx.ui.select(t('notify_select_title'), labels);

            if (!selected) {
              ctx.ui.notify(t('notify_input_cancelled'), 'info');
              if (overlayControls?.isOverlayVisible()) overlayControls.showOverlay();
              return;
            }

            const targetPet = labelToPet.get(selected);
            if (!targetPet) {
              ctx.ui.notify(t('notify_selection_invalid'), 'warning');
              return;
            }

            if (engine.hasPet && engine.state!.id === targetPet.id) {
              ctx.ui.notify(t('notify_already_current'), 'info');
              if (overlayControls?.isOverlayVisible()) overlayControls.showOverlay();
              return;
            }

            await engine.switchToPet(targetPet);
            const sp = getSpecies(targetPet.bones.species);
            ctx.ui.notify(
              t('notify_switched_to', { name: targetPet.name, emoji: sp.emoji, species: sp.name, level: String(targetPet.level) }),
              'info',
            );
            engine.setBubble(t('event_switched_back'));
            ctx.ui.setStatus('pet', buildFooterStatus(engine));
            if (overlayControls?.isOverlayVisible()) overlayControls.showOverlay();
          } catch (err) {
            ctx.ui.notify(t('notify_list_failed', { message: (err as Error).message }), 'error');
          }
          return;
        }

        // ---- hatch ----
        case 'hatch': {
          // Check if there are any imported species
          const available = await listCachedSpecies();
          if (available.length === 0) {
            ctx.ui.notify(
              t('notify_no_species'),
              'warning',
            );
            return;
          }

          if (engine.hasPet) {
            const confirmed = await ctx.ui.confirm(
              t('notify_confirm_hatch_title'),
              t('notify_confirm_hatch_message', { name: engine.petName }),
            );
            if (!confirmed) {
              ctx.ui.notify(t('notify_hatch_cancelled'), 'info');
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
          const prng = (await import('./prng.js')).createPrng(seed + 1);
          const picked = prng.pick(available);
          const speciesId = picked.speciesId;

          await engine.hatch(seed, speciesId);

          // Preload frames
          await loadPet(speciesId);

          const s = engine.state!;
          const sp = getSpecies(s.bones.species);
          const shinyMark = s.bones.isShiny ? ' ✨' : '';
          const rarityLabel = engine.rarityLabel;

          ctx.ui.notify(
            `${t('notify_hatch_success', { name: s.name })}\n` +
            `${sp.emoji} ${sp.name} · ${rarityLabel}${shinyMark} · ${engine.stageName}`,
            'info',
          );

          engine.setBubble(getRandomBubble('excited'));
          ctx.ui.setStatus('pet', buildFooterStatus(engine));

          // Ensure overlay is visible and tick timer is running
          overlayControls?.showOverlay();
          overlayControls?.startTicking?.();
          break;
        }


        // ---- info ----
        case 'info': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify(t('notify_no_pet'), 'warning');
            return;
          }
          const s = engine.state;
          const sp = getSpecies(s.bones.species);
          const shinyMark = s.bones.isShiny ? '✨ ' : '';
          const genderMark = s.bones.gender === 'male' ? t('gender_male') : t('gender_female');
          const rarityLabel = engine.rarityLabel;
          const stats = s.bones.baseStats;
          const skillInfo = s.unlockedSkills.length > 0
            ? (t('notify_info_skills', { skills: s.unlockedSkills.join(', ') }) + (s.equippedSkills.length > 0 ? ` | ${t('notify_info_skills', { skills: s.equippedSkills.join(', ') })}` : ''))
            : t('notify_info_skills', { skills: getLanguage() === 'zh-CN' ? '无（未解锁）' : 'None (unlocked)' });
          const createdDate = new Date(s.createdAt).toLocaleDateString(getLanguage() === 'zh-CN' ? 'zh-CN' : 'en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
          });

          ctx.ui.notify(
            t('notify_info_header', { name: s.name, emoji: sp.emoji, species: sp.name }) + '\n' +
            t('notify_info_divider') + '\n' +
            t('notify_info_rarity', { rarity: rarityLabel, shiny: shinyMark, gender: genderMark, domain: sp.domain }) + '\n' +
            t('notify_info_level', { level: String(s.level), stage: engine.stageName, xp: String(s.xp) }) + '\n' +
            t('notify_info_needs', { hunger: String(s.needs.hunger), energy: String(s.needs.energy), happiness: String(s.needs.happiness), emotion: engine.emotionEmoji }) + '\n' +
            t('notify_info_divider') + '\n' +
            t('notify_info_stats', { debugging: String(stats.debugging), patience: String(stats.patience), chaos: String(stats.chaos) }) + '\n' +
            t('notify_info_wisdom', { wisdom: String(stats.wisdom), snark: String(stats.snark) }) + '\n' +
            t('notify_info_divider') + '\n' +
            t('notify_info_personality', { description: sp.description }) + '\n' +
            `${t('notify_info_skills', { skills: skillInfo })}\n` +
            t('notify_info_stats_line', { sessions: String(s.totalSessions), errors: String(s.totalErrors), tests: String(s.totalTestsPassed) }) + '\n' +
            t('notify_info_created', { date: createdDate }),
            'info',
          );
          break;
        }

        // ---- pet (pet) ----
        case 'pet': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify(t('notify_no_pet_warn'), 'warning');
            return;
          }
          const beforeHappiness = engine.state.needs.happiness;
          engine.doPet();
          const afterHappiness = engine.state.needs.happiness;
          const actualGain = afterHappiness - beforeHappiness;
          const xpAmount = xpFromPetCommand();
          engine.addXp(xpAmount);
          engine.setBubble(t('event_feel_good'));
          setAnimationOverride('play', 2000);
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(
            t('notify_pet_action', { gain: String(actualGain), before: String(beforeHappiness), after: String(afterHappiness), xp: String(xpAmount) }),
            'info',
          );
          break;
        }

        // ---- feed ----
        case 'feed': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify(t('notify_no_pet_warn'), 'warning');
            return;
          }
          const beforeHunger = engine.state.needs.hunger;
          engine.doFeed();
          const afterHunger = engine.state.needs.hunger;
          const actualGain = afterHunger - beforeHunger;
          const xpAmount = xpFromFeedCommand();
          engine.addXp(xpAmount);
          engine.setBubble(t('event_tasty'));
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(
            t('notify_feed_action', { gain: String(actualGain), before: String(beforeHunger), after: String(afterHunger), xp: String(xpAmount) }),
            'info',
          );
          break;
        }

        // ---- name (alias: kept for backward compat) ----
        case 'name':
        // ---- rename (primary) ----
        case 'rename': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify(t('notify_no_pet_warn'), 'warning');
            return;
          }
          const newName = parts.slice(1).join(' ');
          if (!newName) {
            ctx.ui.notify(t('notify_need_name'), 'warning');
            return;
          }
          const sanitized = newName.replace(/[\x00-\x1F\x7F]/g, '').trim();
          if (!sanitized || sanitized.length > 32) {
            ctx.ui.notify(t('notify_name_length'), 'warning');
            return;
          }
          engine.state!.name = sanitized;
          engine.setBubble(t('event_rename', { name: sanitized }));
          await engine.save();
          ctx.ui.setStatus('pet', buildFooterStatus(engine));
          ctx.ui.notify(t('notify_renamed', { name: sanitized }), 'info');
          break;
        }

        // ---- ui (hide/show overlay) ----
        case 'ui': {
          const isVisible = overlayControls?.toggleOverlay() ?? false;
          ctx.ui.notify(isVisible ? t('notify_ui_shown') : t('notify_ui_hidden'), 'info');
          break;
        }

        // ---- release ----
        case 'release': {
          if (!engine.hasPet || !engine.state) {
            ctx.ui.notify(t('notify_no_pet_warn'), 'warning');
            return;
          }
          const confirmed = await ctx.ui.confirm(
            t('notify_release_title'),
            t('notify_release_message', { name: engine.petName }),
          );
          if (!confirmed) {
            ctx.ui.notify(t('notify_release_cancelled'), 'info');
            return;
          }
          const name = engine.petName;
          const s = engine.state;
          const sp = getSpecies(s.bones.species);
          await engine.release();
          ctx.ui.setStatus('pet', undefined);
          ctx.ui.notify(t('notify_released', { name, emoji: sp.emoji, species: sp.name, level: String(s.level) }), 'info');
          break;
        }

        // ---- delete <speciesId> (delete species file, only if no pet uses it) ----
        case 'delete': {
          const speciesId = parts[1];
          if (!speciesId) {
            ctx.ui.notify(t('notify_delete_specify'), 'warning');
            return;
          }

          if (!hasCache(speciesId)) {
            ctx.ui.notify(t('notify_delete_not_found', { speciesId }), 'warning');
            return;
          }

          const existing = await engine.getExistingPetForSpecies(speciesId);
          if (existing) {
            ctx.ui.notify(t('notify_delete_in_use', { speciesId, name: existing.name }), 'warning');
            return;
          }

          const confirmed = await ctx.ui.confirm(
            t('notify_delete_confirm_title'),
            t('notify_delete_confirm_message', { speciesId }),
          );
          if (!confirmed) {
            ctx.ui.notify(t('notify_delete_cancelled'), 'info');
            return;
          }

          await invalidateCache(speciesId);
          unloadPet(speciesId);
          ctx.ui.notify(t('notify_deleted', { speciesId }), 'info');
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
                t('notify_clean_title'),
                t('notify_clean_confirm', { name: engine.petName }),
              );
              if (!confirmed) {
                ctx.ui.notify(t('notify_clean_cancelled'), 'info');
                return;
              }
            } else {
              ctx.ui.notify(t('notify_clean_no_species'), 'warning');
              return;
            }
          }

          if (!hasCache(speciesArg)) {
            ctx.ui.notify(t('notify_clean_not_found', { speciesId: speciesArg }), 'warning');
            return;
          }

          if (engine.hasPet && engine.state && engine.state.bones.species === speciesArg && parts[1]) {
            const confirmed = await ctx.ui.confirm(
              t('notify_clean_title'),
              t('notify_clean_confirm_species', { speciesId: speciesArg }),
            );
            if (!confirmed) {
              ctx.ui.notify(t('notify_clean_cancelled'), 'info');
              return;
            }
          }

          try {
            await invalidateCache(speciesArg);
            unloadPet(speciesArg);
            ctx.ui.notify(t('notify_clean_done', { speciesId: speciesArg }), 'info');
          } catch (err) {
            ctx.ui.notify(t('notify_clean_failed', { message: (err as Error).message }), 'error');
          }
          return;
        }

        // ---- help ----
        case 'help': {
          ctx.ui.notify(
            t('help_title') + '\n' +
            t('help_separator') + '\n' +
            t('help_hatch') + '\n' +
            t('help_info') + '\n' +
            t('help_list') + '\n' +
            t('help_pet') + '\n' +
            t('help_feed') + '\n' +
            t('help_rename') + '\n' +
            t('help_ui') + '\n' +
            t('help_release') + '\n' +
            t('help_import') + '\n' +
            t('help_clean') + '\n' +
            t('help_delete') + '\n' +
            t('help_lang') + '\n' +
            t('help_help'),
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
              t('notify_unknown_cmd_with_pet', {
                sub,
                name: s.name,
                emoji: sp.emoji,
                level: String(s.level),
                stage: engine.stageName,
                emotion: engine.emotionEmoji,
              }),
              'warning',
            );
          } else {
            ctx.ui.notify(
              t('notify_unknown_cmd_no_pet', { sub }),
              'warning',
            );
          }
          break;
        }
      }
    },
  });
}
