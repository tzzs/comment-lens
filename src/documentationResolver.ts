import type { SymbolCandidate } from './candidateScanner';
import { formatDocumentation, type FormattedDocumentation } from './documentationFormatter';

export interface LocationLike {
  uri: string;
  line: number;
  character: number;
}

export interface ResolvedDocumentation extends FormattedDocumentation {
  location?: LocationLike;
}

export interface DocumentationLookup {
  getHoverMarkdownLines(candidate: SymbolCandidate, documentUri: string): Promise<string[]>;
  getDefinitionLocation(candidate: SymbolCandidate, documentUri: string): Promise<LocationLike | undefined>;
  getHoverMarkdownLinesAtLocation(location: LocationLike): Promise<string[]>;
}

export interface DocumentationResolverOptions {
  maxHintLength: number;
  maxCacheEntries?: number;
}

export class DocumentationResolver {
  private readonly cache = new Map<string, ResolvedDocumentation | undefined>();
  private options: DocumentationResolverOptions;

  constructor(
    private readonly lookup: DocumentationLookup,
    options: DocumentationResolverOptions
  ) {
    this.options = options;
  }

  clearCache(): void {
    this.cache.clear();
  }

  updateOptions(options: DocumentationResolverOptions): void {
    this.options = options;
    this.clearCache();
  }

  async resolve(
    candidate: SymbolCandidate,
    documentUri = '',
    documentVersion = 0
  ): Promise<ResolvedDocumentation | undefined> {
    const cacheKey = `${documentUri}:${documentVersion}:${candidate.line}:${candidate.startCharacter}:${candidate.endCharacter}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const fromReference = formatDocumentation(
      await this.lookup.getHoverMarkdownLines(candidate, documentUri),
      this.options.maxHintLength
    );
    if (fromReference) {
      const location = await this.lookup.getDefinitionLocation(candidate, documentUri);
      const result: ResolvedDocumentation = location ? { ...fromReference, location } : fromReference;
      this.setCache(cacheKey, result);
      return result;
    }

    const location = await this.lookup.getDefinitionLocation(candidate, documentUri);
    if (!location) {
      this.setCache(cacheKey, undefined);
      return undefined;
    }

    const fromDefinition = formatDocumentation(
      await this.lookup.getHoverMarkdownLinesAtLocation(location),
      this.options.maxHintLength
    );
    const result = fromDefinition ? { ...fromDefinition, location } : undefined;
    this.setCache(cacheKey, result);
    return result;
  }

  private setCache(cacheKey: string, result: ResolvedDocumentation | undefined): void {
    this.cache.set(cacheKey, result);
    const maxCacheEntries = this.options.maxCacheEntries;
    if (!maxCacheEntries || this.cache.size <= maxCacheEntries) {
      return;
    }

    const oldestKey = this.cache.keys().next().value;
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
