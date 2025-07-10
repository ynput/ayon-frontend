import { FC } from 'react'
import * as Styled from './LinksManager.styled'
import { Button, Icon } from '@ynput/ayon-react-components'
import { getEntityTypeIcon } from '@shared/util'

export type LinkEntity = {
  id: string
  label: string
  entityType: string
  icon?: string
}

export interface LinksManagerProps {
  linkTypeLabel: string
  direction?: 'in' | 'out'
  links: LinkEntity[] // used to display basic info about the links entity
}

export const LinksManager: FC<LinksManagerProps> = ({ linkTypeLabel, direction, links }) => {
  return (
    <Styled.Container>
      <Styled.Header>
        {linkTypeLabel} links ({direction})
      </Styled.Header>
      <Styled.LinksList>
        {links.map((link) => (
          <Styled.LinkItem key={link.id}>
            {link.icon ? (
              <Icon icon={link.icon} />
            ) : (
              <Icon icon={getEntityTypeIcon(link.entityType)} />
            )}
            <span className="label">{link.label}</span>
            <Button icon={'close'} variant="text" className="remove" />
          </Styled.LinkItem>
        ))}
      </Styled.LinksList>
    </Styled.Container>
  )
}
