import type { LanguageAdapter } from './languageAdapter';

export interface LanguageRegistry {
  getAdapter(languageId: string): LanguageAdapter | undefined;
  getAdapters(): readonly LanguageAdapter[];
  getLanguageIds(): string[];
  getEnabledLanguageIds(configuredLanguageIds: readonly string[]): string[];
}

export const goLanguageAdapter: LanguageAdapter = {
  languageIds: ['go'],
  displayName: 'Go',
  supportLevel: 'stable'
};

export const typescriptFamilyLanguageAdapter: LanguageAdapter = {
  languageIds: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
  displayName: 'TypeScript family',
  supportLevel: 'stable'
};

export const defaultLanguageAdapters = [
  goLanguageAdapter,
  typescriptFamilyLanguageAdapter
] as const satisfies readonly LanguageAdapter[];

export function createLanguageRegistry(adapters: readonly LanguageAdapter[]): LanguageRegistry {
  const adaptersByLanguageId = new Map<string, LanguageAdapter>();

  for (const adapter of adapters) {
    for (const languageId of adapter.languageIds) {
      if (adaptersByLanguageId.has(languageId)) {
        throw new Error(`Duplicate language id: ${languageId}`);
      }

      adaptersByLanguageId.set(languageId, adapter);
    }
  }

  return {
    getAdapter(languageId) {
      return adaptersByLanguageId.get(languageId);
    },
    getAdapters() {
      return adapters;
    },
    getLanguageIds() {
      return Array.from(adaptersByLanguageId.keys());
    },
    getEnabledLanguageIds(configuredLanguageIds) {
      return configuredLanguageIds.filter((languageId) => adaptersByLanguageId.has(languageId));
    }
  };
}

export function getDefaultLanguageIds(): string[] {
  return createLanguageRegistry(defaultLanguageAdapters).getLanguageIds();
}
