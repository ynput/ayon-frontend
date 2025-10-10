import {
  ActivityCategory,
  EntityListModel,
  EntityListPatchModel,
  ShareOption,
  useGetUserQuery,
  UserModel,
  useUpdateEntityListMutation,
} from '@shared/api'
import { ACCESS_LEVEL_LABELS, AccessUser, PowerpackButton } from '@shared/components'
import { EVERYONE_GROUP_KEY } from '@shared/components/ShareOptionIcon/ShareOptionIcon'
import { FC } from 'react'
import clsx from 'clsx'

interface ListAccessFallbackProps extends EntityListModel {
  currentUser: UserModel // username of the current user
  shareOptions: ShareOption[] // options for sharing the view
  isShareOptionsLoading?: boolean // loading state for share options
  isLoading?: boolean
  onUpdateList: (payload: EntityListPatchModel) => Promise<void>
  onSuccess?: () => void
  onError?: (error: string) => void
}

export const ListAccessFallback: FC<ListAccessFallbackProps> = ({
  owner,
  access = {},
  currentUser,
  isLoading,
}) => {
  const { data: ownerUser, isFetching: isLoadingOwner } = useGetUserQuery(
    { userName: owner || '' },
    {
      skip: !owner,
    },
  )

  return (
    <>
      {owner && ownerUser && (
        <AccessUser
          name={ownerUser.name || owner}
          // @ts-ignore - ignore missing attribs in user model
          label={ownerUser.attrib?.fullName || owner}
          isMe={currentUser?.name === owner}
          isOwner={true}
          shareType="user"
          className={clsx({ loading: isLoadingOwner || isLoading })}
        />
      )}
      <AccessUser
        name={EVERYONE_GROUP_KEY}
        label="Everyone"
        icon={'groups'}
        className={clsx({ loading: isLoadingOwner || isLoading })}
      >
        <span className="suffix">{ACCESS_LEVEL_LABELS[access[EVERYONE_GROUP_KEY] || 30]}</span>
      </AccessUser>
      {!isLoading && (
        <PowerpackButton
          feature="listAccess"
          label="Manage list access"
          filled
          style={{ marginTop: 8, width: '100%' }}
        />
      )}
    </>
  )
}

type ListData = {
  guestActivityCategories?: {
    [email: string]: string | null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface GuestAccessProps {
  projectName: string
  sessionId: string
  listData?: ListData
  categories: ActivityCategory[]
  isLoading?: boolean
  // mutations
  updateList: ReturnType<typeof useUpdateEntityListMutation>[0]
}

export const GuestAccessFallback: FC<GuestAccessProps> = () => null
