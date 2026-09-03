'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronDown, ChevronUp, Store, Trash2, Loader2 } from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import {
  getShoppingList, localIsoDate,
  type ShoppingList, type ShoppingListGroup, type ShoppingListItem,
} from '@/lib/api/meals'
import { getLang } from '@/lib/i18n'
import { useDarkMode } from '@/lib/use-dark-mode'
import { useLang } from '@/lib/use-lang'
import { useStrings } from '@/lib/use-strings'
import { CATEGORICAL } from '@/lib/admin'

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

// ─── localStorage-only "purchased" state — never sent to the server ──────────

function checkedStorageKey(date: string): string {
  return `shopping_checked_${date}`
}

function loadCheckedFromStorage(date: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(checkedStorageKey(date))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function saveCheckedToStorage(date: string, checked: Set<string>) {
  try {
    localStorage.setItem(checkedStorageKey(date), JSON.stringify([...checked]))
  } catch {
    // localStorage unavailable (private mode, quota) — checked state just won't persist.
  }
}

/** Drops keys for items that no longer exist in a fresh list, so stale checks don't linger. */
function pruneChecked(list: ShoppingList, checked: Set<string>): Set<string> {
  if (list.status === 'pending') return checked
  const known = new Set(list.groups.flatMap((g) => g.items.map((it) => it.key)))
  const pruned = new Set([...checked].filter((k) => known.has(k)))
  return pruned.size === checked.size ? checked : pruned
}

/** Deterministic categorical color per ingredient group, independent of array order. */
function groupAccentIndex(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return hash % CATEGORICAL.length
}

// ─── Shopping row ────────────────────────────────────────────────────────────

function ShoppingRow({
  item, isChecked, isExpanded, onToggleChecked, onToggleExpanded,
}: {
  item: ShoppingListItem
  isChecked: boolean
  isExpanded: boolean
  onToggleChecked: () => void
  onToggleExpanded: () => void
}) {
  const dark = useDarkMode()
  const t = useStrings()
  const panelBorder = dark ? '#2A2A2A' : 'var(--tm-border-i)'
  const hasSources = item.sources.length > 0
  const label = item.quantity_text ? `${item.quantity_text} ${item.name}` : item.name

  return (
    <div style={{ borderTop: `1px solid ${panelBorder}`, opacity: isChecked ? 0.45 : 1, transition: 'opacity 0.2s' }}>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <button
          type="button"
          onClick={onToggleChecked}
          className="rounded-md flex items-center justify-center shrink-0"
          style={{
            width: 22,
            height: 22,
            backgroundColor: isChecked ? '#059669' : 'transparent',
            border: `2px solid ${isChecked ? '#059669' : panelBorder}`,
          }}
          aria-label="Toggle purchased"
        >
          {isChecked && <Check size={13} color="white" />}
        </button>
        <span
          className="text-sm flex-1 truncate"
          style={{ color: 'var(--tm-text)', textDecoration: isChecked ? 'line-through' : 'none' }}
        >
          {label}
        </span>
        {hasSources && (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ color: 'var(--tm-text-3)' }}
            aria-label="Toggle sources"
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        )}
      </div>
      {isExpanded && hasSources && (
        <div className="px-3.5 pb-2.5 space-y-1" style={{ paddingLeft: 52 }}>
          {item.sources.map((src, i) => (
            <p key={i} className="text-xs" style={{ color: 'var(--tm-text-3)' }}>
              {src.recipe_title} — {t.plannedServings(src.servings)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Aisle section ────────────────────────────────────────────────────────────

function AisleSection({
  group, checked, expanded, collapsed, onToggleCollapse, onToggleChecked, onToggleExpanded,
}: {
  group: ShoppingListGroup
  checked: Set<string>
  expanded: Set<string>
  collapsed: boolean
  onToggleCollapse: () => void
  onToggleChecked: (key: string) => void
  onToggleExpanded: (key: string) => void
}) {
  const dark = useDarkMode()
  const panelBorder = dark ? '#2A2A2A' : 'var(--tm-border-i)'
  const aisleLabel = group.aisle || group.aisle_key
  const total = group.items.length
  const done = group.items.filter((it) => checked.has(it.key)).length
  const allDone = done === total && total > 0
  const accentSlot = CATEGORICAL[groupAccentIndex(group.aisle_key)]
  const accent = dark ? accentSlot.dark : accentSlot.light

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{
        backgroundColor: 'var(--tm-surface)',
        borderTop: `1px solid ${panelBorder}`,
        borderRight: `1px solid ${panelBorder}`,
        borderBottom: `1px solid ${panelBorder}`,
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <button type="button" onClick={onToggleCollapse} className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left">
        <span
          className="rounded-lg flex items-center justify-center shrink-0"
          style={{ width: 30, height: 30, backgroundColor: allDone ? '#0596691F' : `${accent}1F` }}
        >
          {allDone ? <Check size={15} color="#059669" /> : <Store size={15} color={accent} />}
        </span>
        <span
          className="text-sm font-bold flex-1 truncate"
          style={{ color: allDone ? 'var(--tm-text-3)' : 'var(--tm-text)', textDecoration: allDone ? 'line-through' : 'none' }}
        >
          {aisleLabel}
        </span>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: done > 0 ? '#0596691F' : 'var(--tm-subtle)', color: done > 0 ? '#059669' : 'var(--tm-text-3)' }}
        >
          {done}/{total}
        </span>
        {collapsed ? <ChevronDown size={16} color="var(--tm-text-3)" /> : <ChevronUp size={16} color="var(--tm-text-3)" />}
      </button>
      {!collapsed && (
        <div style={{ borderTop: `1px solid ${panelBorder}` }}>
          {group.items.map((item) => (
            <ShoppingRow
              key={item.key}
              item={item}
              isChecked={checked.has(item.key)}
              isExpanded={expanded.has(item.key)}
              onToggleChecked={() => onToggleChecked(item.key)}
              onToggleExpanded={() => onToggleExpanded(item.key)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IngredientsDetailPage() {
  const router = useRouter()
  const t = useStrings()
  const lang = useLang()
  const [date] = useState(() => localIsoDate())

  const [list, setList] = useState<ShoppingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState<Set<string>>(() => loadCheckedFromStorage(date))
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [collapsedAisles, setCollapsedAisles] = useState<Set<string>>(new Set())
  const pollRef = useRef<number | null>(null)

  function stopPoll() {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function applyList(data: ShoppingList) {
    setList(data)
    setChecked((prev) => {
      const pruned = pruneChecked(data, prev)
      saveCheckedToStorage(date, pruned)
      return pruned
    })
  }

  async function pollOnce() {
    try {
      const next = await getShoppingList(date, getLang())
      applyList(next)
      if (next.status !== 'pending') stopPoll()
    } catch {
      stopPoll()
    }
  }

  async function load() {
    stopPoll()
    setLoading(true)
    setError('')
    try {
      const data = await getShoppingList(date, getLang())
      applyList(data)
      setLoading(false)
      if (data.status === 'pending') {
        pollRef.current = window.setInterval(pollOnce, 3000)
      }
    } catch (err) {
      setLoading(false)
      setError(errorMessage(err, t.unableToLoadIngredientsDetail))
    }
  }

  useEffect(() => {
    load()
    return () => stopPoll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  function toggleChecked(key: string) {
    const willCheck = !checked.has(key)
    setChecked((prev) => {
      const next = new Set(prev)
      if (willCheck) next.add(key)
      else next.delete(key)
      saveCheckedToStorage(date, next)
      return next
    })
    if (willCheck) {
      setExpanded((prev) => {
        if (!prev.has(key)) return prev
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleAisleCollapsed(aisleKey: string) {
    setCollapsedAisles((prev) => {
      const next = new Set(prev)
      next.has(aisleKey) ? next.delete(aisleKey) : next.add(aisleKey)
      return next
    })
  }

  function clearChecked() {
    setChecked(new Set())
    saveCheckedToStorage(date, new Set())
  }

  const totalItems = list?.groups.reduce((sum, g) => sum + g.items.length, 0) ?? 0
  const checkedCount = list?.groups.reduce((sum, g) => sum + g.items.filter((it) => checked.has(it.key)).length, 0) ?? 0
  const progress = totalItems > 0 ? checkedCount / totalItems : 0
  const pending = list?.status === 'pending'
  const isEmpty = !pending && (!list || list.groups.every((g) => g.items.length === 0))

  return (
    <div className="h-full flex flex-col p-3">
      {/* Header */}
      <div
        className="rounded-2xl p-4 mb-3 shrink-0"
        style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 6px 16px rgba(5,150,105,0.3)' }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/meal-plan')}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            aria-label="Back"
          >
            <ArrowLeft size={17} color="white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-extrabold text-white tracking-tight truncate">{t.ingredientsDetail}</p>
            {!loading && totalItems > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {checkedCount} / {totalItems} {t.purchasedItems.toLowerCase()}
              </p>
            )}
          </div>
          {checked.size > 0 && (
            <button
              type="button"
              onClick={clearChecked}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-white shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            >
              <Trash2 size={13} /> {t.purchasedItems}
            </button>
          )}
        </div>
        {!loading && totalItems > 0 && (
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-2">
        {loading ? (
          <p className="text-sm py-10 text-center" style={{ color: 'var(--tm-text-2)' }}>{t.loading}</p>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--tm-text-2)' }}>{error}</p>
            <button type="button" onClick={load} className="text-xs font-semibold px-4 py-2 rounded-full text-white" style={{ backgroundColor: '#059669' }}>
              {t.retry}
            </button>
          </div>
        ) : pending && (list?.groups.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={28} className="animate-spin mb-3" color="#059669" />
            <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>{t.organizingIngredientsDetail}</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>{t.emptyIngredientsDetail}</p>
          </div>
        ) : (
          <>
            {pending && (
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 mb-3" style={{ backgroundColor: '#0596691F' }}>
                <Loader2 size={14} className="animate-spin" color="#059669" />
                <p className="text-xs font-medium" style={{ color: '#059669' }}>{t.organizingIngredientsDetail}</p>
              </div>
            )}
            {!pending && totalItems > 0 && checkedCount === totalItems && (
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 mb-3" style={{ backgroundColor: '#0596691F' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#059669' }}>
                  <Check size={13} color="white" />
                </span>
                <p className="text-xs font-semibold" style={{ color: '#059669' }}>{t.ingredientsDetailAllDone}</p>
              </div>
            )}
            {(list?.groups ?? []).map((group) => (
              <AisleSection
                key={group.aisle_key}
                group={group}
                checked={checked}
                expanded={expanded}
                collapsed={collapsedAisles.has(group.aisle_key)}
                onToggleCollapse={() => toggleAisleCollapsed(group.aisle_key)}
                onToggleChecked={toggleChecked}
                onToggleExpanded={toggleExpanded}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
