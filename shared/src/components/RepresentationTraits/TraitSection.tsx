import { FC, ReactNode, useState } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { useLocalStorage } from '@shared/hooks'
import * as Styled from './RepresentationTraits.styled'
import { getMissingDefinitionText, pickTraitView, TraitItem, TraitView } from './utils/traitModel'

// view picked per versionless trait id, shared by all representations
const VIEWS_STORAGE_KEY = 'representation-trait-views'

interface TraitSectionProps {
  item: TraitItem
  children: (view: TraitView) => ReactNode
  defaultExpanded?: boolean
}

/** Collapsible card of one trait: name, version, definition state and the view switcher. */
export const TraitSection: FC<TraitSectionProps> = ({ item, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [preferred, setPreferred] = useLocalStorage<Record<string, string>>(VIEWS_STORAGE_KEY, {})
  const { parsed, definition, views } = item
  const view = pickTraitView(views, preferred?.[parsed.versionlessId])

  return (
    <Styled.Section data-trait-id={item.id} data-trait-view={view.id}>
      <Styled.HeaderRow>
        <Styled.SectionHeader
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <Icon icon={expanded ? 'expand_more' : 'chevron_right'} />
          <span className="name" data-tooltip={definition?.description || undefined}>
            {item.label}
          </span>
          {parsed.version !== null && <Styled.Tag>v{parsed.version}</Styled.Tag>}
          {!definition && (
            <Styled.Tag className="warning" data-tooltip={getMissingDefinitionText(item)}>
              No definition
            </Styled.Tag>
          )}
          {definition?.deprecated && (
            <Styled.Tag data-tooltip="The addon defining this trait marks this version as deprecated">
              Deprecated
            </Styled.Tag>
          )}
          {definition?.conflict && (
            <Styled.Tag
              className="error"
              data-tooltip="Installed addon versions define this trait with different data models"
            >
              Conflict
            </Styled.Tag>
          )}
          <span className="id">{item.id}</span>
        </Styled.SectionHeader>
        {expanded && views.length > 1 && (
          <Styled.ViewSwitcher role="radiogroup" aria-label="Trait view">
            {views.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={option.id === view.id}
                className={clsx({ active: option.id === view.id })}
                data-tooltip={option.label}
                onClick={() =>
                  setPreferred((value) => ({ ...value, [parsed.versionlessId]: option.id }))
                }
              >
                <Icon icon={option.icon} />
              </button>
            ))}
          </Styled.ViewSwitcher>
        )}
      </Styled.HeaderRow>
      {expanded && <Styled.SectionBody>{children(view)}</Styled.SectionBody>}
    </Styled.Section>
  )
}
