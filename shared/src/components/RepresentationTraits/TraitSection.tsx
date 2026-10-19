import { FC, ReactNode, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './RepresentationTraits.styled'
import { getMissingDefinitionText, TraitItem } from './utils/traitModel'

interface TraitSectionProps {
  item: TraitItem
  children: ReactNode
  defaultExpanded?: boolean
}

/** Collapsible card of one trait: name, version and definition state. */
export const TraitSection: FC<TraitSectionProps> = ({ item, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { parsed, definition, renderer } = item

  return (
    <Styled.Section data-trait-id={item.id}>
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
        {renderer.kind === 'raw' && (
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
      {expanded && <Styled.SectionBody>{children}</Styled.SectionBody>}
    </Styled.Section>
  )
}
