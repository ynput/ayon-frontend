import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'
import { forwardRef } from 'react'
import ReviewVersionDropdown from '@components/ReviewVersionDropdown'
import { useSelector } from 'react-redux'
import { upperFirst } from 'lodash'
import { getVersionShortcutTargets } from './hooks/useReviewShortcuts'

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
    data-tooltip-position="bottom"
    data-shortcut={shortcut?.children}
    shortcut={shortcut}
    {...props}
  >
    {beforeContent}
    {name}
    {afterContent}
  </Styled.NavButton>
)

const VersionSelectorTool = forwardRef(({ versions, selected, onChange }, ref) => {
  const statuses = useSelector((state) => state.project.statuses) || {}

  const selectedIndex = versions.findIndex(({ id }) => id === selected)
  if (selectedIndex === -1) return

  const allVersions = getVersionShortcutTargets(versions, selected, statuses)
  const { latest: latestVersion, approved: approvedVersion, hero: heroVersion } = allVersions
  // raw neighbour checks for disabled state (helper falls back to selected)
  const hasPrevious = !!versions[selectedIndex - 1]
  const hasNext = !!versions[selectedIndex + 1]

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
    <Styled.Tools ref={ref}>
      <NavButton
        version={allVersions.previous}
        className="previous"
        onClick={onChange}
        disabled={!hasPrevious}
        beforeContent={<Icon icon="chevron_left" />}
        shortcut={{ children: 'A' }}
      />
      <ReviewVersionDropdown options={options} value={selected} onChange={onChange} />
      <NavButton
        version={allVersions.next}
        className="next"
        onClick={onChange}
        disabled={!hasNext}
        afterContent={<Icon icon="chevron_right" />}
        shortcut={{ children: 'D', side: 'left' }}
      />
      <NavButton
        version={allVersions.latest}
        className="latest"
        onClick={onChange}
        disabled={!latestVersion}
        beforeContent={'Latest - '}
        data-shortcut={'R'}
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
})

export default VersionSelectorTool
