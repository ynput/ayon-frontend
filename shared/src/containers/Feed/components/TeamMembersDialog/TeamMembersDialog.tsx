import React from 'react'
import { Dialog, Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

interface TeamMember {
  name: string
  fullName?: string
  isLeader?: boolean
}

interface TeamMembersDialogProps {
  open: boolean
  teamName: string
  memberCount?: number
  teamLeader?: string
  members?: TeamMember[]
  onClose: () => void
}

const MembersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
`

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

const MemberName = styled.span`
  flex: 1;
  font-weight: 500;
`

const LeaderBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background-color: #4caf50;
  border-radius: 12px;
  color: white;
  white-space: nowrap;
`

const TeamMembersDialog: React.FC<TeamMembersDialogProps> = ({
  open,
  teamName,
  memberCount,
  teamLeader,
  members,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title={`${teamName} Team — ${memberCount || 0} members`}
      size="sm"
    >
      <MembersContainer>
        {members && members.length > 0 ? (
          members.map((member) => (
            <MemberItem key={member.name}>
              <MemberName>{member.fullName || member.name}</MemberName>
              {member.isLeader && <LeaderBadge>Leader</LeaderBadge>}
            </MemberItem>
          ))
        ) : teamLeader ? (
          <MemberItem>
            <MemberName>Team Lead: {teamLeader}</MemberName>
          </MemberItem>
        ) : (
          <p>No team members available</p>
        )}
      </MembersContainer>
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      </div>
    </Dialog>
  )
}

export default TeamMembersDialog