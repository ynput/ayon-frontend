import { Icon } from '@ynput/ayon-react-components'
import { teamsApi } from '@shared/api'
import { useFeedContext } from '../../../context/FeedContext'
import UserImage from '../../../../../components/UserImage'
import * as Styled from './TeamTooltip.styled'

const MAX_VISIBLE_MEMBERS = 5

interface TeamTooltipProps {
  name?: string
  pos: {
    top: number
    left: number
  }
}

const TeamTooltip = ({ name, pos }: TeamTooltipProps) => {
  const { projectName } = useFeedContext()

  const { data: teams = [] } = teamsApi.useGetTeamsQuery(
    { projectName, showMembers: true },
    { skip: !projectName || !name },
  )

  const team = teams.find((t) => t.name === name)
  const members = team?.members ?? []
  const memberCount = team?.memberCount ?? 0
  const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS)
  const remaining = memberCount - MAX_VISIBLE_MEMBERS

  return (
    <Styled.Popup style={{ ...pos }}>
      <Styled.Header>
        <Icon icon="group" />
        <Styled.HeaderContent>
          <span>{name}</span>
          <span className="label">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </Styled.HeaderContent>
      </Styled.Header>
      {visibleMembers.length > 0 && (
        <Styled.MembersList>
          {visibleMembers.map((member) => (
            <Styled.MemberItem key={member.name}>
              <UserImage name={member.name} />
              <span>{member.name}</span>
            </Styled.MemberItem>
          ))}
          {remaining > 0 && <Styled.MoreLabel>+{remaining} more</Styled.MoreLabel>}
        </Styled.MembersList>
      )}
    </Styled.Popup>
  )
}

export default TeamTooltip
