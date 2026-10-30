import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import type { AnyContribution, Contribution } from './contributions'
import type { Loader, SlotMap, SlotName } from './slots'

type AnyLoader = Loader<unknown>

const pending = new WeakMap<AnyLoader, Promise<unknown>>()
const loaded = new WeakMap<AnyLoader, unknown>()

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))

/** Loads a piece once: later calls get the same promise, or the value once it has loaded. */
export const loadPiece = <T>(loader: Loader<T>): Promise<T> => {
  if (loaded.has(loader)) return Promise.resolve(loaded.get(loader) as T)
  let promise = pending.get(loader) as Promise<T> | undefined
  if (!promise) {
    promise = loader().then((module) => {
      if (!module || !('default' in module)) {
        throw new Error('the file has no default export')
      }
      loaded.set(loader, module.default)
      return module.default
    })
    pending.set(loader, promise)
    // a failed load (network, a redeploy) is tried again next time
    promise.catch(() => pending.delete(loader))
  }
  return promise
}

/** Starts loading a piece without waiting for it, e.g. when a menu opens. */
export const prefetchPiece = (loader: AnyLoader | undefined) => {
  if (loader) loadPiece(loader).catch(() => undefined)
}

export interface PieceState<T> {
  value: T | undefined
  error: Error | undefined
  isLoading: boolean
}

/** Loads a piece when the calling component mounts. */
export const usePiece = <T>(loader: Loader<T> | undefined): PieceState<T> => {
  const [state, setState] = useState<PieceState<T>>(() =>
    loader && loaded.has(loader)
      ? { value: loaded.get(loader) as T, error: undefined, isLoading: false }
      : { value: undefined, error: undefined, isLoading: !!loader },
  )

  useEffect(() => {
    if (!loader) return
    if (loaded.has(loader)) {
      setState({ value: loaded.get(loader) as T, error: undefined, isLoading: false })
      return
    }
    let cancelled = false
    setState({ value: undefined, error: undefined, isLoading: true })
    loadPiece(loader).then(
      (value) => !cancelled && setState({ value, error: undefined, isLoading: false }),
      (error) => !cancelled && setState({ value: undefined, error: toError(error), isLoading: false }),
    )
    return () => {
      cancelled = true
    }
  }, [loader])

  return state
}

/** The name a contribution shows under: its label or title, else its id. */
export const contributionTitle = ({ label, title, id }: AnyContribution) =>
  String(title || label || id)

/** Logs a failed contribution and tells the user, naming the addon. */
export const reportContributionError = (contribution: AnyContribution, error: unknown) => {
  const err = toError(error)
  console.error(
    `[addon ${contribution.addon.name}] ${contribution.key} (${contribution.slot}) failed`,
    err,
  )
  // one toast per contribution and message, also when React runs the effect twice
  toast.error(`${contributionTitle(contribution)} (${contribution.addon.name}): ${err.message}`, {
    toastId: `addon-error:${contribution.key}:${err.message}`,
  })
}

/**
 * Runs a contribution's `run` piece (menu items): loads it, calls it with the slot context and
 * reports an error instead of throwing, so a broken item can't break the menu it is in.
 */
export const runContribution = async <S extends SlotName>(
  contribution: Contribution<S>,
  context: SlotMap[S]['context'],
  piece = 'run',
) => {
  const any = contribution as unknown as AnyContribution
  try {
    const loader = any[piece] as AnyLoader
    const run = await loadPiece(loader)
    if (typeof run !== 'function') throw new Error(`"${piece}" has no default export function`)
    await run({ ...(context as object), slot: any.slot })
  } catch (error) {
    reportContributionError(any, error)
  }
}
