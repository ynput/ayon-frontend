import clsx from 'clsx'
import { $Any } from '@types'
import * as Styled from './ProjectUserAccessAccessGroupPanel.styled'
import { Icon, Spacer } from '@ynput/ayon-react-components'

type Props = {
  header: $Any
  isExpanded: boolean
  children: $Any
  onToggleExpand: $Any
}

const ProjectUserAccesAccessGroupPanel = ({
  header,
  children,
  isExpanded,
  onToggleExpand,
}: Props) => {
  return (
    <Styled.Wrapper>
      <Styled.Header onClick={() => onToggleExpand && onToggleExpand(!isExpanded)}>
        <div style={{ display: 'flex' }}>
          {header}
          <Spacer />
          <Icon icon={isExpanded ? 'collapse_all' : 'expand_all'} />
        </div>
      </Styled.Header>

      <Styled.BodyExpander
        className={clsx({ expanded: isExpanded })}
      >
        <Styled.Body
          className={clsx(isExpanded ? 'expanded' : 'collapsed')}
        >
          {children}
        </Styled.Body>
      </Styled.BodyExpander>
    </Styled.Wrapper>
  )
}

export default ProjectUserAccesAccessGroupPanel
