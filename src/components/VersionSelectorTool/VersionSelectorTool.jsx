import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'
import ShortcutWidget from '../ShortcutWidget/ShortcutWidget'
import { useRef } from 'react'
import usePreviewShortcuts from './hooks/usePreviewShortcuts'

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
    onClick={() => onClick(id)}
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
  const previousVersion = versions[selectedIndex - 1] || selectedVersion
  const nextVersion = versions[selectedIndex + 1] || selectedVersion
  const latestVersion = versions[versions.length - 1]

  const allVersions = {
    previous: previousVersion,
    selected: selectedVersion,
    next: nextVersion,
    latest: latestVersion,
  }

  // approved is the last version with status approved
  const approvedVersion = versions
    .slice()
    .reverse()
    .find(({ status }) => status === 'approved')

  const toolsRef = useRef(null)

  const shortcuts = usePreviewShortcuts({ allVersions, onChange, toolsRef })

  return (
    <>
      {shortcuts}
      <Styled.Tools ref={toolsRef}>
        <NavButton
          version={previousVersion}
          className="previous"
          icon="chevron_left"
          onClick={onChange}
          disabled={!previousVersion}
          beforeContent={<Icon icon="chevron_left" />}
          afterContent={<ShortcutWidget>Z</ShortcutWidget>}
        />
        <Styled.NavButton>{selectedVersion.name}</Styled.NavButton>
        <NavButton
          version={nextVersion}
          className="next"
          icon="chevron_right"
          onClick={onChange}
          disabled={!nextVersion}
          afterContent={<Icon icon="chevron_right" />}
          beforeContent={<ShortcutWidget>C</ShortcutWidget>}
        />
        <NavButton
          version={latestVersion}
          className="latest"
          onClick={onChange}
          disabled={!latestVersion}
          beforeContent={'Latest - '}
          afterContent={<ShortcutWidget>V</ShortcutWidget>}
        />
        <NavButton
          version={approvedVersion}
          className="approved"
          onClick={onChange}
          disabled={!approvedVersion}
          beforeContent={'Approved - '}
          afterContent={approvedVersion && <ShortcutWidget>B</ShortcutWidget>}
        />
      </Styled.Tools>
    </>
  )
}

export default VersionSelectorTool
