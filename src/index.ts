import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { PetEngine } from './pet_instance.ts';
import { bindEvents } from './events.ts';
import { registerCommands } from './commands.ts';

export default function (pi: ExtensionAPI) {
  const engine = new PetEngine();

  // Register events (returns toggle controls)
  const overlayControls = bindEvents(pi, engine);

  // Register commands
  registerCommands(pi, engine, overlayControls);
}
