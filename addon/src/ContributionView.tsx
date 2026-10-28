import { Component, useMemo } from 'react'
import type { ComponentType, CSSProperties, ErrorInfo, ReactNode } from 'react'
import type { AnyContribution, Contribution } from './contributions'
import { contributionTitle, usePiece } from './pieces'
import type { Loader, SlotMap, SlotName } from './slots'
import { SlotReactContext } from './SlotContextInstance'

const errorStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  // a page or panel lays its content out with flex: keep the box to its own size
  alignSelf: 'flex-start',
  flex: '0 0 auto',
  maxWidth: 'calc(100% - 16px)',
  boxSizing: 'border-box',
  gap: 8,
  margin: 8,
  padding: '8px 12px',
  borderRadius: 4,
  color: 'var(--md-sys-color-on-error-container)',
  background: 'var(--md-sys-color-error-container)',
  fontSize: 13,
  overflow: 'hidden',
}

interface ContributionErrorProps {
  contribution: AnyContribution
  error: Error
  /** what failed, e.g. "failed to load" */
  phase?: string
}

/** What a contribution shows instead of itself when it fails. */
export const ContributionError = ({
  contribution,
  error,
  phase = 'crashed',
}: ContributionErrorProps) => (
  <div role="alert" className="ayon-addon-error" style={errorStyle} title={error.stack}>
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
      error
    </span>
    <span>
      <strong>{contributionTitle(contribution)}</strong> ({contribution.addon.name}) {phase}:{' '}
      {error.message}
    </span>
  </div>
)

interface BoundaryProps {
  contribution: AnyContribution
  fallback?: (error: Error) => ReactNode
  children: ReactNode
}

/** Keeps a crash inside one contribution: the rest of the page keeps working. */
export class ContributionErrorBoundary extends Component<BoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const { contribution } = this.props
    console.error(
      `[addon ${contribution.addon.name}] ${contribution.key} (${contribution.slot}) crashed`,
      error,
      info.componentStack,
    )
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      this.props.fallback?.(error) ?? (
        <ContributionError contribution={this.props.contribution} error={error} />
      )
    )
  }
}

export interface ContributionViewProps<S extends SlotName> {
  contribution: Contribution<S>
  /** the slot's context; memoize it, the component re-renders when it changes */
  context: SlotMap[S]['context']
  /** which piece to render, `component` by default */
  piece?: string
  /** shown while the piece loads */
  loading?: ReactNode
  /** replaces the default error box */
  error?: (error: Error) => ReactNode
}

interface PieceProps {
  loader: Loader<unknown> | undefined
  props: object
  contribution: AnyContribution
  loading: ReactNode
  error?: (error: Error) => ReactNode
}

const Piece = ({ loader, props, contribution, loading, error }: PieceProps) => {
  const { value, error: loadError, isLoading } = usePiece(loader)
  if (loadError) {
    return (
      error?.(loadError) ?? (
        <ContributionError contribution={contribution} error={loadError} phase="failed to load" />
      )
    )
  }
  if (isLoading || !value) return <>{loading}</>
  const Rendered = value as ComponentType<object>
  return <Rendered {...props} />
}

/**
 * Renders one piece of a contribution: loads it, shows `loading` meanwhile, keeps a crash inside
 * an error box and gives the piece's components the slot context (`useSlot`). The piece gets the
 * context as props.
 */
export const ContributionView = <S extends SlotName>({
  contribution,
  context,
  piece = 'component',
  loading = null,
  error,
}: ContributionViewProps<S>) => {
  const anyContribution = contribution as unknown as AnyContribution
  const { slot } = anyContribution
  const value = useMemo(() => ({ ...(context as object), slot }), [context, slot])
  const active = useMemo(
    () => ({ slot, value, contribution: anyContribution }),
    [slot, value, anyContribution],
  )
  const loader = anyContribution[piece] as Loader<unknown> | undefined

  return (
    <ContributionErrorBoundary key={anyContribution.key} contribution={anyContribution} fallback={error}>
      <SlotReactContext.Provider value={active}>
        <Piece
          loader={loader}
          props={value}
          contribution={anyContribution}
          loading={loading}
          error={error}
        />
      </SlotReactContext.Provider>
    </ContributionErrorBoundary>
  )
}
