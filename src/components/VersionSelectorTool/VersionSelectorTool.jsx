import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'
import ShortcutWidget from '../ShortcutWidget'
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
  ...props
}) => (
  <Styled.NavButton
    {...props}
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
  const selectRef = useRef(null)

  const toolsRef = useRef(null)

  usePreviewShortcuts({ allVersions, onChange, toolsRef, selectRef })

  if (selectedIndex === -1) return

  return (
    <Styled.Tools ref={toolsRef}>
      <NavButton
        version={allVersions.previous}
        className="previous"
        onClick={onChange}
        disabled={!previousVersion}
        beforeContent={<Icon icon="chevron_left" />}
        afterContent={<ShortcutWidget>Z</ShortcutWidget>}
        shortcut={'Z'}
      />
      <PreviewVersionDropdown
        versions={versions}
        selected={selected}
        onChange={onChange}
        selectRef={selectRef}
      />
      <NavButton
        version={allVersions.next}
        className="next"
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
        shortcut={'Shift+C'}
        selected={selected === latestVersion?.id}
        afterContent={latestVersion && <ShortcutWidget>Shift+C</ShortcutWidget>}
      />
      <NavButton
        version={allVersions.approved}
        className="approved"
        onClick={onChange}
        disabled={!approvedVersion}
        beforeContent={'Approved - '}
        shortcut={'Shift+X'}
        selected={selected === approvedVersion?.id}
        afterContent={approvedVersion && <ShortcutWidget>Shift+X</ShortcutWidget>}
      />
      {heroVersion && (
        <NavButton
          version={allVersions.hero}
          className="hero"
          onClick={onChange}
          shortcut={'SHift+H'}
          selected={selected === heroVersion?.id}
          afterContent={heroVersion && <ShortcutWidget>Shift+H</ShortcutWidget>}
        />
      )}
    </Styled.Tools>
  )
}

export default VersionSelectorTool
