"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "./useDebounce";

export interface SearchSuggestion {
  id: string;
  title: string;
  category?: string;
}

type SuggestionFetcher = (query: string) => SearchSuggestion[];

const cache = new Map<string, SearchSuggestion[]>();

export function useSearchSuggestions(
  query: string,
  fetchSuggestions: SuggestionFetcher,
  options: { delay?: number; minLength?: number; maxResults?: number } = {},
) {
  const { delay = 250, minLength = 2, maxResults = 6 } = options;
  const debouncedQuery = useDebounce(query, delay);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const fetchRef = useRef(fetchSuggestions);
  fetchRef.current = fetchSuggestions;

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < minLength) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const key = trimmed.toLowerCase();
    if (cache.has(key)) {
      const cached = cache.get(key)!;
      setSuggestions(cached.slice(0, maxResults));
      setIsOpen(cached.length > 0);
      return;
    }

    const results = fetchRef.current(trimmed).slice(0, maxResults);
    cache.set(key, results);
    setSuggestions(results);
    setIsOpen(results.length > 0);
  }, [debouncedQuery, minLength, maxResults]);

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => {
    if (suggestions.length > 0) setIsOpen(true);
  }, [suggestions.length]);

  return { suggestions, isOpen, close, open };
}
