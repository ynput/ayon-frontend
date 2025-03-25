import { useState } from 'react'
import * as Styled from './ActivityGroup.styled'
import ActivityItem from '../ActivityItem'
import { Icon } from '@ynput/ayon-react-components'

const ActivityGroup = ({ activities, editProps, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Styled.Wrapper>
        <Styled.More onClick={() => setIsOpen(!isOpen)}>
          <Icon icon={isOpen ? 'expand_less' : 'chevron_right'} />
          {isOpen ? 'Show less' : 'Show more'}
        </Styled.More>
      </Styled.Wrapper>
      {isOpen &&
        activities.map((activity) => (
          <ActivityItem key={activity.activityId} editProps={editProps} activity={activity} fromGroup {...props} />
        ))}
    </>
  )
}

export default ActivityGroup
