import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'
import { useRef } from 'react'
import useReviewShortcuts from './hooks/useReviewShortcuts'
import ReviewVersionDropdown from '@components/ReviewVersionDropdown'
import { useSelector } from 'react-redux'
import { upperFirst } from 'lodash'

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
    disabled={disabled}
    className={className}
    id={`${className}-${id}`}
    onClick={() => onClick(id)}
    data-tooltip={`${upperFirst(className)} version`}
    data-shortcut={shortcut?.children}
    shortcut={shortcut}
    {...props}
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

  useReviewShortcuts({ allVersions, onChange, toolsRef, selectRef })

  if (selectedIndex === -1) return

  const options = [...versions]
    .sort((a, b) => {
      if (a.name === 'HERO') return -1 // HERO version should always be first
      if (b.name === 'HERO') return 1
      return Number(b.version) - Number(a.version)
    })
    .map(({ id, name }) => ({
      value: id,
      label: name,
    }))

  return (
    <Styled.Tools ref={toolsRef}>
      <NavButton
        version={allVersions.previous}
        className="previous"
        onClick={onChange}
        disabled={!previousVersion}
        beforeContent={<Icon icon="chevron_left" />}
        shortcut={{ children: 'A' }}
      />
      <ReviewVersionDropdown
        options={options}
        value={selected}
        onChange={onChange}
        selectRef={selectRef}
      />
      <NavButton
        version={allVersions.next}
        className="next"
        onClick={onChange}
        disabled={!nextVersion}
        afterContent={<Icon icon="chevron_right" />}
        shortcut={{ children: 'D', side: 'left' }}
      />
      <NavButton
        version={allVersions.latest}
        className="latest"
        onClick={onChange}
        disabled={!latestVersion}
        beforeContent={'Latest - '}
        data-shortcut={'F'}
        selected={selected === latestVersion?.id}
      />
      <NavButton
        version={allVersions.approved}
        className="approved"
        onClick={onChange}
        disabled={!approvedVersion}
        beforeContent={'Approved - '}
        data-shortcut={'E'}
        selected={selected === approvedVersion?.id}
      />
      {heroVersion && (
        <NavButton
          version={allVersions.hero}
          className="hero"
          onClick={onChange}
          data-shortcut={'H'}
          selected={selected === heroVersion?.id}
        />
      )}
    </Styled.Tools>
  )
}

export default VersionSelectorTool
