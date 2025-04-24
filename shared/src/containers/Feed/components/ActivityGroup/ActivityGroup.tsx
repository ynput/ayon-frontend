import { useState } from 'react'
import * as Styled from './ActivityGroup.styled'
import ActivityItem from '../ActivityItem'
import { Icon } from '@ynput/ayon-react-components'

interface ActivityGroupProps {
  activities: any[]
  editProps?: {
    disabled?: boolean
    isLoading?: boolean
  }
}

const ActivityGroup = ({ activities, editProps, ...props }: ActivityGroupProps) => {
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
          // @ts-expect-error
          <ActivityItem
            key={activity.activityId}
            editProps={editProps}
            activity={activity}
            fromGroup
            {...props}
          />
        ))}
    </>
  )
}

export default ActivityGroup
