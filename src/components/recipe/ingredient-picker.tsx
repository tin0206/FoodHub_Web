"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { searchIngredients } from "@/lib/api/recipes";
import type {
  IngredientCatalogEntry,
  IngredientCatalogUnit,
  MappedIngredient,
  RecipeIngredientItem,
} from "@/lib/api/types";
import { DEFAULT_ACCENT, inlineInputClass } from "./form-styles";

export interface IngredientRowValue {
  localId: string;
  mappedId: number | null;
  name: string;
  units: IngredientCatalogUnit[];
  amount: string;
  unit: string;
}

function genId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function newIngredientRow(): IngredientRowValue {
  return { localId: genId(), mappedId: null, name: "", units: [], amount: "", unit: "" };
}

/** Seeds the picker from an already-mapped recipe (edit mode). Each row only
 * knows the one unit it was saved with — the full unit list comes back once
 * the ingredient is searched again. */
export function mappedIngredientsToRows(items: MappedIngredient[]): IngredientRowValue[] {
  if (items.length === 0) return [newIngredientRow()];
  return items.map((it) => ({
    localId: genId(),
    mappedId: it.mapped_id,
    name: it.natural_name || it.mapped_name,
    units: [
      {
        unit: it.unit,
        grams_per_unit: it.amount > 0 ? it.total_grams / it.amount : 0,
      },
    ],
    amount: String(it.amount),
    unit: it.unit,
  }));
}

export function rowsToIngredientItems(rows: IngredientRowValue[]): RecipeIngredientItem[] {
  return rows
    .filter((r) => r.mappedId != null && r.unit && Number(r.amount) > 0)
    .map((r) => ({ mapped_id: r.mappedId!, amount: Number(r.amount), unit: r.unit }));
}

function IngredientRow({
  value,
  onChange,
  onRemove,
  canRemove,
  accent,
  placeholder,
}: {
  value: IngredientRowValue;
  onChange: (v: IngredientRowValue) => void;
  onRemove: () => void;
  canRemove: boolean;
  accent: string;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<IngredientCatalogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  function handleQueryChange(q: string) {
    onChange({ ...value, name: q, mappedId: null, units: [], unit: "" });
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setOpen(true);
    const requestId = ++requestIdRef.current;
    debounceRef.current = window.setTimeout(() => {
      setSearching(true);
      searchIngredients(q, 8)
        .then((results) => {
          if (requestIdRef.current !== requestId) return;
          setSuggestions(results);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setSuggestions([]);
        })
        .finally(() => {
          if (requestIdRef.current !== requestId) return;
          setSearching(false);
        });
    }, 250);
  }

  function selectSuggestion(entry: IngredientCatalogEntry) {
    const firstUnit = entry.units[0];
    onChange({
      ...value,
      mappedId: entry.id,
      name: entry.natural_name || entry.name,
      units: entry.units,
      unit: firstUnit?.unit ?? "",
    });
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="flex items-start gap-2">
      <div className="relative flex-1 min-w-0">
        <input
          value={value.name}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => {
            if (value.name.trim() && !value.mappedId) setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className={`text-[13px] ${inlineInputClass}`}
          style={{ color: "var(--tm-text)" }}
        />
        {open && (
          <div
            className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg overflow-hidden max-h-52 overflow-y-auto"
            style={{
              backgroundColor: "var(--tm-surface)",
              border: "1px solid var(--tm-border-i)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
            }}
          >
            {searching ? (
              <p className="text-xs px-3 py-2" style={{ color: "var(--tm-text-3)" }}>
                Searching…
              </p>
            ) : suggestions.length === 0 ? (
              <p className="text-xs px-3 py-2" style={{ color: "var(--tm-text-3)" }}>
                No matches
              </p>
            ) : (
              suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-[13px] hover:opacity-80 transition-opacity"
                  style={{ color: "var(--tm-text)" }}
                >
                  {s.natural_name || s.name}
                  {s.natural_name && s.natural_name !== s.name && (
                    <span className="text-[11px] ml-1.5" style={{ color: "var(--tm-text-3)" }}>
                      ({s.name})
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {value.mappedId != null && (
        <>
          <input
            type="text"
            inputMode="decimal"
            value={value.amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value.replace(/[^0-9.]/g, "") })}
            placeholder="0"
            className={`w-14 text-[13px] text-right ${inlineInputClass}`}
            style={{ color: "var(--tm-text)" }}
          />
          <select
            value={value.unit}
            onChange={(e) => onChange({ ...value, unit: e.target.value })}
            className={`text-[13px] ${inlineInputClass}`}
            style={{ color: "var(--tm-text)" }}
          >
            {value.units.map((u) => (
              <option key={u.unit} value={u.unit}>
                {u.unit}
              </option>
            ))}
          </select>
        </>
      )}

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 mt-1.5"
          style={{ color: "var(--tm-text-3)" }}
          aria-label="Remove ingredient"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function IngredientPicker({
  rows,
  onChange,
  accent = DEFAULT_ACCENT,
  addLabel = "Add ingredient",
}: {
  rows: IngredientRowValue[];
  onChange: (rows: IngredientRowValue[]) => void;
  accent?: string;
  addLabel?: string;
}) {
  function updateAt(i: number, v: IngredientRowValue) {
    const next = [...rows];
    next[i] = v;
    onChange(next);
  }
  function removeAt(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  function addRow() {
    onChange([...rows, newIngredientRow()]);
  }

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <IngredientRow
          key={r.localId}
          value={r}
          onChange={(v) => updateAt(i, v)}
          onRemove={() => removeAt(i)}
          canRemove={rows.length > 1}
          accent={accent}
          placeholder={`Ingredient ${i + 1}`}
        />
      ))}
      <button
        type="button"
        onClick={addRow}
        className="mt-1 flex items-center gap-1 text-xs font-semibold"
        style={{ color: accent }}
      >
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}
