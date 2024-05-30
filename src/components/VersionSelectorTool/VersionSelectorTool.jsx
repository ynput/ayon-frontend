import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'

const NavButton = ({
  version: { id = 'none', name = 'None' } = {},
  className,
  beforeContent,
  afterContent,
  onClick,
  disabled,
}) => (
  <Styled.NavButton
    disabled={disabled}
    className={className}
    id={`${className}-${id}`}
    onClick={(e) => onClick(e, id)}
  >
    {beforeContent}
    {name}
    {afterContent}
  </Styled.NavButton>
)

const VersionSelectorTool = ({ versions, selected, onChange }) => {
  // get the version before the selected version
  const selectedIndex = versions.findIndex(({ id }) => id === selected)

  if (selectedIndex === -1) return

  const selectedVersion = versions[selectedIndex]
  const previousVersion = versions[selectedIndex - 1]
  const nextVersion = versions[selectedIndex + 1]
  const latestVersion = versions[versions.length - 1]
  // approved is the last version with status approved
  const approvedVersion = versions
    .slice()
    .reverse()
    .find(({ status }) => status === 'approved')

  return (
    <Styled.Tools>
      <NavButton
        version={previousVersion || selectedVersion}
        className="previous"
        icon="chevron_left"
        onClick={onChange}
        disabled={!previousVersion}
        beforeContent={<Icon icon="chevron_left" />}
      />
      <Styled.NavButton>{selectedVersion.name}</Styled.NavButton>
      <NavButton
        version={nextVersion || selectedVersion}
        className="next"
        icon="chevron_right"
        onClick={onChange}
        disabled={!nextVersion}
        afterContent={<Icon icon="chevron_right" />}
      />
      <NavButton
        version={latestVersion || selectedVersion}
        className="latest"
        onClick={onChange}
        disabled={!latestVersion}
        beforeContent={'Latest - '}
      />
      <NavButton
        version={approvedVersion}
        className="approved"
        onClick={onChange}
        disabled={!approvedVersion}
        beforeContent={'Approved - '}
      />
    </Styled.Tools>
  )
}

export default VersionSelectorTool
