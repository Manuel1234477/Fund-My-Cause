"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getCampaignTokens, type TokenInfo } from "@/lib/defi-integration";

interface TokenSelectorProps {
  contractId: string;
  /** Currently selected token address */
  value: string;
  onChange: (tokenAddress: string) => void;
  disabled?: boolean;
  /** Pre-loaded token list (skip fetching if provided) */
  tokens?: TokenInfo[];
}

/**
 * Dropdown for selecting the contribution token.
 * Fetches the campaign's accepted-token list and lets the contributor pick one.
 */
export function TokenSelector({
  contractId,
  value,
  onChange,
  disabled = false,
  tokens: tokensProp,
}: TokenSelectorProps) {
  const [tokens, setTokens] = useState<TokenInfo[]>(tokensProp ?? []);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(!tokensProp);

  useEffect(() => {
    if (tokensProp) return;
    let cancelled = false;
    setLoading(true);
    getCampaignTokens(contractId)
      .then((t) => {
        if (!cancelled) {
          setTokens(t);
          // Auto-select first token if none selected yet
          if (t.length > 0 && !value) onChange(t[0].address);
        }
      })
      .catch(() => {
        // Silently fall back; parent keeps whatever value is set
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractId, tokensProp, value, onChange]);

  const selected = tokens.find((t) => t.address === value);

  // Single-token: render a read-only badge instead of a dropdown
  if (!loading && tokens.length <= 1) {
    return (
      <span className="ds-input px-3 py-2 text-sm opacity-70 select-none">
        {selected?.symbol ?? value.slice(0, 8)}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select contribution token"
        onClick={() => setOpen((o) => !o)}
        className="ds-input flex items-center gap-2 px-3 py-2 text-sm min-w-[7rem] disabled:opacity-50"
      >
        <span className="flex-1 text-left">
          {loading ? "…" : (selected?.symbol ?? "Select")}
        </span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Contribution token options"
          className="absolute z-10 mt-1 w-full min-w-[12rem] ds-card py-1 shadow-lg"
        >
          {tokens.map((token) => (
            <li
              key={token.address}
              role="option"
              aria-selected={token.address === value}
              onClick={() => {
                onChange(token.address);
                setOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-white/10
                ${token.address === value ? "font-semibold" : ""}`}
            >
              <span className="font-mono text-xs opacity-60 w-12 shrink-0">
                {token.symbol}
              </span>
              <span className="truncate">{token.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
