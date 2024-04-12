import React from 'react'
import * as Styled from './FeedHeader.styled'
import { UserImage } from '@ynput/ayon-react-components'
import { useGetUserQuery } from '/src/services/user/getUsers'
import { formatDistanceToNow, isValid } from 'date-fns'
import Typography from '/src/theme/typography.module.css'
import FeedReference from '../FeedReference/FeedReference'

const FeedHeader = ({ name, users, date, reference }) => {
  // first check if the users are already in users
  const userInUsers = users?.find((user) => user.name === name)
  // get user based on user name
  const { data: userData = {} } = useGetUserQuery({ name }, { skip: userInUsers || !name })

  let user = userData
  if (userInUsers) user = userInUsers

  const fuzzyDate =
    date && isValid(new Date(date)) ? formatDistanceToNow(new Date(date), { addSuffix: true }) : ''

  return (
    <Styled.Header>
      <UserImage
        fullName={user.fullName}
        src={user.name && `/api/users/${user.name}/avatar`}
        name={user.name}
        size={22}
      />
      <h5>{user.fullName || user.name}</h5>
      {reference && (
        <>
          <span>on</span>
          <FeedReference type={reference.refType} variant="text" label={reference.label}>
            {reference.label}
          </FeedReference>
        </>
      )}
      <Styled.Date className={Typography.bodySmall}>{fuzzyDate}</Styled.Date>
    </Styled.Header>
  )
}

export default FeedHeader
