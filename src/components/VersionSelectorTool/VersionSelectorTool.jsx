import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'
import ShortcutWidget from '../ShortcutWidget/ShortcutWidget'
import { useRef } from 'react'
import usePreviewShortcuts from './hooks/usePreviewShortcuts'
import PreviewVersionDropdown from './PreviewVersionDropdown/PreviewVersionDropdown'
import { useSelector } from 'react-redux'

const NavButton = ({
  version: { id = 'none', name = 'None' } = {},
  className,
  beforeContent,
  afterContent,
  onClick,
  disabled,
  shortcut,
}) => (
  <Styled.NavButton
    disabled={disabled}
    className={className}
    id={`${className}-${id}`}
    onClick={() => onClick(id)}
    data-tooltip={`Select ${className} version`}
    data-shortcut={shortcut}
  >
    {beforeContent}
    {name}
    {afterContent}
  </Styled.NavButton>
)

const VersionSelectorTool = ({ versions, selected, onChange }) => {
  const statuses = useSelector((state) => state.project.statuses) || {}
  // get the version before the selected version
  const selectedIndex = versions.findIndex(({ id }) => id === selected)

  const selectedVersion = versions[selectedIndex]
  const previousVersion = versions[selectedIndex - 1]
  const nextVersion = versions[selectedIndex + 1]
  const latestVersion = versions[versions.length - 1]
  // approved is the last version with status approved
  const approvedVersion = versions
    .slice()
    .reverse()
    .find(({ status }) => statuses[status] && statuses[status].state === 'done')
  // get any hero version if there is one
  const heroVersion = versions.find(({ name }) => name === 'HERO')

  const allVersions = {
    previous: previousVersion || selectedVersion,
    selected: selectedVersion,
    next: nextVersion || selectedVersion,
    latest: latestVersion,
    approved: approvedVersion,
    hero: heroVersion,
  }

  const toolsRef = useRef(null)

  const shortcuts = usePreviewShortcuts({ allVersions, onChange, toolsRef })

  if (selectedIndex === -1) return

  return (
    <>
      {shortcuts}
      <Styled.Tools ref={toolsRef}>
        <NavButton
          version={allVersions.previous}
          className="previous"
          icon="chevron_left"
          onClick={onChange}
          disabled={!previousVersion}
          beforeContent={<Icon icon="chevron_left" />}
          afterContent={<ShortcutWidget>Z</ShortcutWidget>}
          shortcut={'Z'}
        />
        <PreviewVersionDropdown versions={versions} selected={selected} onChange={onChange} />
        <NavButton
          version={allVersions.next}
          className="next"
          icon="chevron_right"
          onClick={onChange}
          disabled={!nextVersion}
          afterContent={<Icon icon="chevron_right" />}
          beforeContent={<ShortcutWidget>C</ShortcutWidget>}
          shortcut={'C'}
        />
        <NavButton
          version={allVersions.latest}
          className="latest"
          onClick={onChange}
          disabled={!latestVersion}
          beforeContent={'Latest - '}
          shortcut={'V'}
          // afterContent={<ShortcutWidget>V</ShortcutWidget>}
        />
        <NavButton
          version={allVersions.approved}
          className="approved"
          onClick={onChange}
          disabled={!approvedVersion}
          beforeContent={'Approved - '}
          shortcut={'B'}
          // afterContent={approvedVersion && <ShortcutWidget>B</ShortcutWidget>}
        />
        {heroVersion && (
          <NavButton
            version={allVersions.hero}
            className="hero"
            onClick={onChange}
            beforeContent={'Hero'}
            shortcut={'N'}
            // afterContent={approvedVersion && <ShortcutWidget>N</ShortcutWidget>}
          />
        )}
      </Styled.Tools>
    </>
  )
}

export default VersionSelectorTool
