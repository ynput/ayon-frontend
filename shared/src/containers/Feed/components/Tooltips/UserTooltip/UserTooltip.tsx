import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import { teamsApi } from '@shared/api'
import UserTooltipItem from '../UserTooltipItem'
import * as Styled from './UserTooltip.styled'

const VIEWPORT_MARGIN = 8

interface UserTooltipProps {
  name?: string
  label?: string
  /** when set, the tooltip also lists the teams this user belongs to in that project */
  projectName?: string
  pos: {
    top: number
    left: number
  }
}

const UserTooltip = ({ name, label, projectName, pos }: UserTooltipProps) => {
  // only runs while the tooltip is mounted, so nothing is fetched until a hover
  const { data: teams = [] } = teamsApi.useGetTeamsQuery(
    { projectName: projectName as string, showMembers: true },
    { skip: !projectName || !name },
  )

  const memberships = teams
    .map((team) => ({ team, member: team.members?.find((m) => m.name === name) }))
    .filter((membership) => !!membership.member)

  const popupRef = useRef<HTMLSpanElement>(null)
  const [left, setLeft] = useState(pos.left)

  // the popup is centred on the anchor, which pushes it off screen near an edge
  useLayoutEffect(() => {
    const width = popupRef.current?.offsetWidth
    if (!width) return

    const half = width / 2
    const max = window.innerWidth - half - VIEWPORT_MARGIN
    const min = half + VIEWPORT_MARGIN
    setLeft(Math.min(Math.max(pos.left, min), Math.max(min, max)))
  }, [pos.left, memberships.length])

  return (
    <Styled.Popup
      ref={popupRef}
      style={{ ...pos, left }}
      className={memberships.length ? 'with-teams' : undefined}
    >
      <UserTooltipItem name={name || ''} fullName={label} showSubtitle size={32} />
      {memberships.length > 0 && (
        <Styled.Teams>
          {memberships.map(({ team, member }) => (
            <Styled.TeamItem key={team.name}>
              <Icon icon={member?.leader ? 'star' : 'group'} />
              <span>{team.name}</span>
              {!!member?.roles?.length && <span className="label">{member.roles.join(', ')}</span>}
            </Styled.TeamItem>
          ))}
        </Styled.Teams>
      )}
    </Styled.Popup>
  )
}

export default UserTooltip
