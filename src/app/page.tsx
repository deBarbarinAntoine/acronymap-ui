"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Input, Spinner } from '@heroui/react';
import { Search, BookOpen, ArrowRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { acronymApi, type AcronymResult } from '@/lib/api';
import { AcronymCard } from '@/components/ui/AcronymCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AcronymResult[] | null>(null);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  const debouncedQuery = useDebounce(query, 400);

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults(null);
      setCount(0);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await acronymApi.search(searchTerm.trim());
      setResults(response.results);
      setCount(response.count);
    } catch (error) {
      console.error('Search failed:', error);
      setResults(null);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery !== initialQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery, initialQuery, performSearch]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      router.push(`/?q=${encodeURIComponent(value.trim())}`, { scroll: false });
    } else {
      router.push('/', { scroll: false });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      performSearch(query.trim());
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-2xl mx-auto mt-12 md:mt-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            AcronyMap
          </h1>
        </div>
        <p className="text-muted mb-8 text-base md:text-lg">
          The collaborative dictionary for corporate and technical acronyms
        </p>

        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder="Search acronyms... (e.g., AWS, API, CI/CD)"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-border/60 bg-surface shadow-lg hover:shadow-xl focus-within:shadow-xl focus-within:border-primary/50 transition-all text-base"
          />
          {isLoading && (
            <Spinner size="sm" color="current" className="absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="w-full max-w-2xl mx-auto mt-10 px-4">
        {isLoading && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" color="accent" />
            <p className="text-muted text-sm">Searching...</p>
          </div>
        )}

        {!isLoading && hasSearched && results && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Found <span className="font-medium text-foreground">{count}</span> result{count !== 1 ? 's' : ''}
            </p>
            {results.map((result) => (
              <AcronymCard
                key={result.master_id}
                masterId={result.master_id}
                search={result.search}
                data={result.data}
                highlight={query}
              />
            ))}
          </div>
        )}

        {!isLoading && hasSearched && (!results || results.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Search className="h-12 w-12 text-muted/40" />
            <h3 className="text-lg font-medium">No results found</h3>
            <p className="text-sm text-muted max-w-sm">
              We couldn&apos;t find any acronyms matching &ldquo;{query}&rdquo;. Try a different search term.
            </p>
          </div>
        )}

        {!isLoading && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <BookOpen className="h-12 w-12 text-muted/40" />
            <h3 className="text-lg font-medium">Start exploring</h3>
            <p className="text-sm text-muted max-w-sm">
              Search for any acronym to find its definition, aliases, and more.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['AWS', 'API', 'CI/CD', 'SaaS', 'OKR'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    performSearch(suggestion);
                    router.push(`/?q=${encodeURIComponent(suggestion)}`, { scroll: false });
                  }}
                  className="px-3 py-1.5 text-sm rounded-full bg-surface-secondary hover:bg-surface-tertiary transition-colors border border-border/40 flex items-center gap-1"
                >
                  {suggestion}
                  <ArrowRight className="h-3 w-3 text-muted" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full max-w-2xl mx-auto mt-12 md:mt-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            AcronyMap
          </h1>
        </div>
        <p className="text-muted mb-8 text-base md:text-lg">
          The collaborative dictionary for corporate and technical acronyms
        </p>
        <div className="w-full h-14 pl-12 pr-12 rounded-2xl border border-border/60 bg-surface shadow-lg animate-pulse" />
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
