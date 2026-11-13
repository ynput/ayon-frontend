// `ayon-addon open | preview` checks that the contribution it is about really rendered: a slot that
// is on stage and has a context doesn't mean its component mounted (a details panel tab stays a
// button until it is picked, a column cell needs rows). The shell wraps that contribution's pieces
// in the manifest before registering it: a component piece reports when it mounts and unmounts, a
// `run` piece when it runs. Nothing else changes, and the page only does it for the contribution
// named in the URL.
import { createElement, useEffect } from 'react'
import type { ComponentType } from 'react'

/** Pieces that are React components, rendered where the slot shows (or in a dialog, a popover). */
export const COMPONENT_PIECES = ['component', 'cell', 'dialog', 'popover'] as const
/** Pieces that are functions the host calls (a menu item, a shortcut). */
export const RUN_PIECES = ['run'] as const

export type PieceEvent = { piece: string; event: 'mount' | 'unmount' | 'run' }

type Loader = () => Promise<{ default?: unknown }>
type Entry = Record<string, unknown> & { slot?: unknown; id?: unknown }

const trackComponent = (
  Component: ComponentType<object>,
  piece: string,
  report: (event: PieceEvent) => void,
) => {
  const Tracked = (props: object) => {
    // after the piece's own tree committed: a piece that throws while rendering never reports
    useEffect(() => {
      report({ piece, event: 'mount' })
      return () => report({ piece, event: 'unmount' })
    }, [])
    return createElement(Component, props)
  }
  Tracked.displayName = Component.displayName || Component.name || 'Piece'
  return Tracked
}

const trackRun =
  (run: (...args: unknown[]) => unknown, piece: string, report: (event: PieceEvent) => void) =>
  (...args: unknown[]) => {
    report({ piece, event: 'run' })
    return run(...args)
  }

const wrapLoader = (loader: Loader, piece: string, report: (event: PieceEvent) => void): Loader => {
  const component = (COMPONENT_PIECES as readonly string[]).includes(piece)
  return () =>
    Promise.resolve()
      .then(loader)
      .then((module) => {
        // the SDK reports a missing default export itself
        if (!module || typeof module.default !== 'function') return module
        const wrapped = component
          ? trackComponent(module.default as ComponentType<object>, piece, report)
          : trackRun(module.default as (...args: unknown[]) => unknown, piece, report)
        return { ...module, default: wrapped }
      })
}

/**
 * The manifest with the pieces of one contribution (`slot` and `id`) wrapped to report what they
 * do. Returns the manifest unchanged when it isn't one or has no such contribution, whether it has
 * it, and the names of the pieces it wrapped.
 */
export const trackContribution = (
  manifest: unknown,
  slot: string | undefined,
  id: string | undefined,
  report: (event: PieceEvent) => void,
): { manifest: unknown; found: boolean; pieces: string[] } => {
  const contributes = (manifest as { contributes?: unknown } | null)?.contributes
  if (!slot || !id || !Array.isArray(contributes)) return { manifest, found: false, pieces: [] }
  let found = false
  let pieces: string[] = []
  const tracked = contributes.map((entry: Entry) => {
    if (!entry || entry.slot !== slot || entry.id !== id) return entry
    found = true
    const copy: Entry = { ...entry }
    pieces = [...COMPONENT_PIECES, ...RUN_PIECES].filter(
      (piece) => typeof entry[piece] === 'function',
    )
    for (const piece of pieces) copy[piece] = wrapLoader(entry[piece] as Loader, piece, report)
    return copy
  })
  return {
    manifest: pieces.length ? { ...(manifest as object), contributes: tracked } : manifest,
    found,
    pieces,
  }
}
