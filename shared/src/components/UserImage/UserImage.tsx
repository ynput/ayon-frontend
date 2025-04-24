import React from 'react'
import { UserImage as UserImageArc } from '@ynput/ayon-react-components'
import clsx from 'clsx'

interface UserImageProps {
  name: string
  fullName?: string
  imageKey?: string
  className?: string
  size?: number
  [key: string]: any // For any other props that might be passed
}

// wraps the ARC UserImage component to use new user image api
export const UserImage: React.FC<UserImageProps> = ({ name, fullName, imageKey, ...props }) => {
  if (!name) return <UserImageArc name="" className={clsx(props.className, 'loading')} {...props} />
  return (
    <UserImageArc
      name={name}
      fullName={fullName}
      src={`/api/users/${name}/avatar?key=${imageKey || ''}`}
      {...props}
    />
  )
}
