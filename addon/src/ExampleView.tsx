import { useContext } from 'react'
import type { CSSProperties } from 'react'
import { contributionTitle } from './pieces'
import { SlotReactContext } from './SlotContextInstance'

/** What `ExampleView` gets: the props of the piece it is in (the slot context), and `inline`. */
export interface ExampleViewProps {
  /** one line, for small places (a table cell, a badge): the context is in its tooltip */
  inline?: boolean
  [field: string]: unknown
}

const MAX = 48

const shorten = (text: string) => (text.length > MAX ? `${text.slice(0, MAX - 1)}…` : text)

/** A context value in a few words: a string, a count of a list, the name of an object. */
export const shortValue = (item: unknown): string => {
  if (typeof item === 'string') return shorten(JSON.stringify(item))
  if (typeof item === 'function') return 'ƒ()'
  if (Array.isArray(item)) {
    return item.length ? shorten(`[${item.length}] ${shortValue(item[0])}${item.length > 1 ? ', …' : ''}`) : '[]'
  }
  if (item && typeof item === 'object') {
    const { name, label, id } = item as Record<string, unknown>
    const named = [name, label, id].find((field) => typeof field === 'string')
    return named ? shorten(`{ ${JSON.stringify(named)} }`) : shorten(`{ ${Object.keys(item).join(', ')} }`)
  }
  return String(item)
}

const boxStyle: CSSProperties = {
  boxSizing: 'border-box',
  margin: 8,
  padding: '8px 12px',
  borderRadius: 4,
  border: '1px dashed var(--md-sys-color-tertiary)',
  background: 'var(--md-sys-color-tertiary-container)',
  color: 'var(--md-sys-color-on-tertiary-container)',
  fontSize: 12,
  overflow: 'hidden',
}

const inlineStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  maxWidth: '100%',
  padding: '0 4px',
  borderRadius: 4,
  border: '1px dashed var(--md-sys-color-tertiary)',
  background: 'var(--md-sys-color-tertiary-container)',
  color: 'var(--md-sys-color-on-tertiary-container)',
  fontSize: 11,
  lineHeight: '16px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

/**
 * The default content of an example contribution: the slot it is in and the context it got (keys
 * and short values). An example component of your own can render it inside it, with its props.
 */
export const ExampleView = ({ inline, ...context }: ExampleViewProps) => {
  const active = useContext(SlotReactContext)
  const slot = String(context.slot ?? active?.slot ?? '')
  const title = active ? contributionTitle(active.contribution) : 'Example'
  const entries = Object.entries(context).filter(([key]) => key !== 'slot')
  const lines = entries.map(([key, item]) => `${key}: ${shortValue(item)}`)

  if (inline) {
    return (
      <span style={inlineStyle} title={[`Example contribution to ${slot}`, ...lines].join('\n')}>
        {title}
      </span>
    )
  }
  return (
    <div style={boxStyle} className="ayon-example">
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {title} <span style={{ fontWeight: 400, opacity: 0.8 }}>· example contribution to {slot}</span>
      </div>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 8 }}>
        {entries.map(([key, item]) => (
          <div key={key} style={{ display: 'contents' }}>
            <dt style={{ opacity: 0.8 }}>{key}</dt>
            <dd style={{ margin: 0, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {shortValue(item)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** `ExampleView` in one line. */
export const ExampleInline = (props: ExampleViewProps) => <ExampleView {...props} inline />

export default ExampleView
