import clsx from 'clsx'
import { $Any } from '@types'
import * as Styled from './ProjectUserAccessAccessGroupPanel.styled'
import { Icon } from '@ynput/ayon-react-components'

type Props = {
  header: $Any
  isExpanded: boolean
  children: $Any
  onToggleExpand: $Any
}

const ProjectUserAccessAccessGroupPanel = ({
  header,
  children,
  isExpanded,
  onToggleExpand,
}: Props) => {
  return (
    <Styled.Wrapper>
      <Styled.Header onClick={() => onToggleExpand && onToggleExpand(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon icon={isExpanded ? 'expand_more' : 'chevron_right'} />
          {header}
        </div>
      </Styled.Header>

      <Styled.BodyExpander className={clsx({ expanded: isExpanded })}>
        <Styled.Body className={clsx(isExpanded ? 'expanded' : 'collapsed')}>
          {children}
        </Styled.Body>
      </Styled.BodyExpander>
    </Styled.Wrapper>
  )
}

export default ProjectUserAccessAccessGroupPanel
