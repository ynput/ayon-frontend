import { ReactNode } from 'react'

type SearchHiddenProps = {
  /** Whether the field matches the search; one that doesn't stays mounted, but takes no room */
  matches: boolean
  schemaId?: string
  className?: string
  children: ReactNode
}

/**
 * Wraps a field, group or list that a settings search can hide. Hidden content stays
 * mounted (its state and the outline's anchors survive), out of view and out of the flow.
 */
const SearchHidden = ({ matches, schemaId, className, children }: SearchHiddenProps) => (
  <div
    data-schema-id={schemaId}
    data-hidden={matches ? 'false' : 'true'}
    style={{
      visibility: matches ? 'visible' : 'hidden',
      position: matches ? 'relative' : 'absolute',
      height: matches ? 'auto' : 0,
    }}
    className={className}
  >
    {children}
  </div>
)

export default SearchHidden
