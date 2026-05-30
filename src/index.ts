import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { PetEngine } from './pet_instance.js';
import { bindEvents } from './events.js';
import { registerCommands } from './commands.js';

export default function (pi: ExtensionAPI) {
  const engine = new PetEngine();

  // Register events (returns toggle controls)
  const overlayControls = bindEvents(pi, engine);

  // Register commands
  registerCommands(pi, engine, overlayControls);
}
