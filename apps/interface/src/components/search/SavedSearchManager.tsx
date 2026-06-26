"use client";

import React, { useState } from "react";
import { Bookmark, Trash2, Pencil, Check, X } from "lucide-react";
import type { SavedSearch } from "@/services/savedSearch.service";
import type { SearchFilters } from "@/services/search.service";

interface Props {
  savedSearches: SavedSearch[];
  /** Restore a saved search's filters into the search UI. */
  onRestore: (filters: SearchFilters) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  /** Save current active filters with a name. */
  onSaveCurrent: (name: string) => void;
  hasActiveFilters: boolean;
}

export function SavedSearchManager({
  savedSearches,
  onRestore,
  onDelete,
  onRename,
  onSaveCurrent,
  hasActiveFilters,
}: Props) {
  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleSave = () => {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    onSaveCurrent(trimmed);
    setSaveName("");
    setShowSaveInput(false);
  };

  const handleRename = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    onRename(id, trimmed);
    setEditingId(null);
    setEditingName("");
  };

  const startEdit = (search: SavedSearch) => {
    setEditingId(search.id);
    setEditingName(search.name);
  };

  return (
    <div className="space-y-3">
      {/* Save current search */}
      {hasActiveFilters && (
        <div className="space-y-2">
          {showSaveInput ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setShowSaveInput(false);
                }}
                placeholder="Name this search…"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                aria-label="Name for saved search"
              />
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
                aria-label="Confirm save"
              >
                <Check size={14} aria-hidden="true" />
              </button>
              <button
                onClick={() => setShowSaveInput(false)}
                className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
                aria-label="Cancel"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveInput(true)}
              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300"
            >
              <Bookmark size={14} aria-hidden="true" />
              Save current search
            </button>
          )}
        </div>
      )}

      {/* Saved search list */}
      {savedSearches.length === 0 ? (
        <p className="text-xs text-gray-500">No saved searches yet.</p>
      ) : (
        <ul className="space-y-1" aria-label="Saved searches">
          {savedSearches.map((search) => (
            <li
              key={search.id}
              className="flex items-center gap-2 group rounded-lg px-2 py-1.5 hover:bg-gray-800"
            >
              {editingId === search.id ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(search.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-sm text-white focus:outline-none"
                    aria-label="Edit search name"
                  />
                  <button
                    onClick={() => handleRename(search.id)}
                    className="p-1 text-green-400 hover:text-green-300"
                    aria-label="Confirm rename"
                  >
                    <Check size={13} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-gray-400 hover:text-gray-300"
                    aria-label="Cancel rename"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onRestore(search.filters)}
                    className="flex-1 text-left text-sm text-gray-200 hover:text-white truncate"
                    aria-label={`Restore saved search: ${search.name}`}
                  >
                    {search.name}
                  </button>
                  <button
                    onClick={() => startEdit(search)}
                    className="p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Rename saved search: ${search.name}`}
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onDelete(search.id)}
                    className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Delete saved search: ${search.name}`}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
