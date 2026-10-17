import { FC, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import styled from 'styled-components'
import { InputText, theme } from '@ynput/ayon-react-components'

const MAX_SUGGESTIONS = 12

const Wrapper = styled.div`
  position: relative;
  width: 100%;

  input {
    width: 100%;
  }
`

const List = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-highest);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 8px;
    border-radius: var(--border-radius-m);
    cursor: pointer;
    ${theme.bodyMedium}

    .value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .count {
      ${theme.labelSmall}
      color: var(--md-sys-color-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }

    &.active {
      background-color: var(--md-sys-color-surface-container-highest-hover);
      outline: 1px solid var(--md-sys-color-primary);
    }
  }
`

type Suggestion = { value: string; count: number }

/** Exact topics plus their wildcard groups, eg `entity.task.*` for `entity.task.status_changed` */
const buildSuggestions = (topicCounts: Map<string, number>): Suggestion[] => {
  const counts = new Map<string, number>(topicCounts)
  for (const [topic, count] of topicCounts) {
    const parts = topic.split('.')
    for (let i = 1; i < parts.length; i++) {
      const group = `${parts.slice(0, i).join('.')}.*`
      counts.set(group, (counts.get(group) ?? 0) + count)
    }
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

export interface TopicInputProps {
  /** loaded topics and how often they occur */
  topicCounts: Map<string, number>
  selected: string[]
  onAdd: (topic: string) => void
}

export const TopicInput: FC<TopicInputProps> = ({ topicCounts, selected, onAdd }) => {
  const [draft, setDraft] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  const all = useMemo(() => buildSuggestions(topicCounts), [topicCounts])
  const suggestions = useMemo(() => {
    const query = draft.trim().toLowerCase()
    return all
      .filter(
        (s) => !selected.includes(s.value) && (!query || s.value.toLowerCase().includes(query)),
      )
      .slice(0, MAX_SUGGESTIONS)
  }, [all, draft, selected])

  const add = (topic: string) => {
    const value = topic.trim()
    if (value) onAdd(value)
    setDraft('')
    setActiveIndex(-1)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault()
        setIsOpen(true)
        if (!suggestions.length) return
        const step = e.key === 'ArrowDown' ? 1 : -1
        const next = (activeIndex + step + suggestions.length) % suggestions.length
        setActiveIndex(next)
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
        return
      }
      case 'Enter':
        e.preventDefault()
        add(activeIndex >= 0 && isOpen ? suggestions[activeIndex].value : draft)
        return
      case 'Escape':
        if (isOpen) {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(false)
          setActiveIndex(-1)
        }
        return
    }
  }

  const showList = isOpen && suggestions.length > 0

  return (
    <Wrapper>
      <InputText
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setIsOpen(true)}
        // delay so a click on a suggestion lands before the list closes
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        onKeyDown={handleKeyDown}
        placeholder="entity.task.*"
        aria-label="Add topic filter"
        role="combobox"
        aria-expanded={showList}
        aria-controls="events-topic-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `events-topic-${activeIndex}` : undefined}
        autoComplete="off"
      />
      {showList && (
        <List id="events-topic-suggestions" role="listbox" ref={listRef}>
          {suggestions.map((s, i) => (
            <li
              key={s.value}
              id={`events-topic-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={clsx({ active: i === activeIndex })}
              onMouseDown={(e) => {
                e.preventDefault()
                add(s.value)
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="value">{s.value}</span>
              <span className="count">{s.count}</span>
            </li>
          ))}
        </List>
      )}
    </Wrapper>
  )
}
