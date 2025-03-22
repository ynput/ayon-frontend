import { Icon, theme } from '@ynput/ayon-react-components'
import { Expander } from '@containers/Slicer/SlicerTable.styled'
import styled from 'styled-components'

const StyledEntityNameWidget = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 100%;
  width: 100%;
  padding-right: 8px;
`

const StyledContentWrapper = styled.div`
  width: 100%;
  height: 24px;
  overflow: hidden;
  position: relative;
`

const StyledContentAbsolute = styled.div`
  position: absolute;
  inset: 0;
`

const StyledContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  padding: 2px 4px;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  overflow: hidden;
  width: fit-content;
  max-width: 100%;
  height: 100%;

  /* &:hover {
    &,
    .icon,
    .path {
      color: var(--md-sys-color-primary);
    }
  } */
`

const StyledTextContent = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .path {
    ${theme.labelSmall}
    margin-bottom: -4px;
    color: var(--md-sys-color-outline);
  }

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

type EntityNameWidgetProps = {
  id: string
  label: string
  name: string
  path?: string | null
  showHierarchy?: boolean
  icon: string | null
  type: string
  isExpanded: boolean
  toggleExpanderHandler: (e: React.MouseEvent, id: string) => void
  toggleExpanded: () => void
}

export const EntityNameWidget = ({
  id,
  label,
  name,
  path,
  showHierarchy,
  icon,
  type,
  isExpanded,
  toggleExpanderHandler,
  toggleExpanded,
}: EntityNameWidgetProps) => {
  return (
    <StyledEntityNameWidget>
      {showHierarchy ? (
        type === 'folder' ? (
          <Expander
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanderHandler(e, id)
              toggleExpanded()
            }}
            icon={isExpanded ? 'expand_more' : 'chevron_right'}
          />
        ) : (
          <div style={{ display: 'inline-block', minWidth: 24 }} />
        )
      ) : null}
      <StyledContentWrapper style={{ height: path ? 32 : 24 }}>
        <StyledContentAbsolute>
          <StyledContent>
            {icon && <Icon icon={icon} />}
            <StyledTextContent>
              {path && <span className="path">{path}</span>}
              <span className="label">{label || name}</span>
            </StyledTextContent>
          </StyledContent>
        </StyledContentAbsolute>
      </StyledContentWrapper>
    </StyledEntityNameWidget>
  )
}
