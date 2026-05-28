// Type declarations for pi runtime module
// These are only used for TypeScript compilation; the actual types
// are provided by the pi runtime when the extension is loaded.

declare module '@earendil-works/pi-coding-agent' {
  export interface ExtensionAPI {
    on(event: string, handler: (...args: any[]) => void | Promise<void>): void;
    registerTool(definition: Record<string, unknown>): void;
    registerCommand(name: string, options: {
      description: string;
      getArgumentCompletions?: (prefix: string) => Array<{ label: string; insertValue: string }>;
      handler: (args: string, ctx: ExtensionContext) => void | Promise<void>;
    }): void;
    appendEntry(type: string, data: unknown): void;
  }

  export interface ExtensionContext {
    ui: {
      setWidget(key: string, lines: string[] | undefined): void;
      setStatus(key: string, text: string | undefined): void;
      notify(message: string, level: 'info' | 'warning' | 'error'): void;
      confirm(title: string, message: string): Promise<boolean>;
    };
    cwd: string;
  }
}
