import { Status } from '@api/rest/project'
import { Icon } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`

const StyledStatus = styled.span`
  border-radius: var(--border-radius-m);
  padding: 2px 6px;
  margin: 0 2px;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  &,
  .icon {
    color: black;
  }

  .icon {
    font-size: 16px;
    font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 300, 'opsz' 20;
  }
`

interface ActivityStatusProps {
  name: string
  statuses: Status[]
  children?: React.ReactNode
}

const ActivityStatus: FC<ActivityStatusProps> = ({ name, statuses, children }) => {
  // find status by name or use fallback
  const foundStatus = findStatus(name, statuses)

  return (
    <StyledContainer>
      {children}
      <StyledStatus style={{ backgroundColor: foundStatus.color }}>
        {foundStatus.icon && <Icon icon={foundStatus.icon} />}
        {name}
      </StyledStatus>
    </StyledContainer>
  )
}

export default ActivityStatus

const findStatus = (name: string, statuses: Status[]) => {
  const fallback: Status = { name: name, color: 'var(--md-sys-color-primary)', icon: undefined }
  return statuses.find((s) => s.name === name) || fallback
}
