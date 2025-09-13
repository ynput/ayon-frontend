import {
  EntityListModel,
  EntityListPatchModel,
  ShareOption,
  useGetUserByNameQuery,
  UserModel,
} from '@shared/api'
import { ACCESS_LEVEL_LABELS, AccessUser, PowerpackButton } from '@shared/components'
import { EVERYONE_GROUP_KEY } from '@shared/components/ShareOptionIcon/ShareOptionIcon'
import { usePowerpack } from '@shared/context'
import { FC } from 'react'

interface ListAccessFallbackProps extends EntityListModel {
  currentUser: UserModel // username of the current user
  shareOptions: ShareOption[] // options for sharing the view
  isShareOptionsLoading?: boolean // loading state for share options
  isLoading?: boolean
  onUpdateList: (payload: EntityListPatchModel) => Promise<void>
  onSuccess?: () => void
  onError?: (error: any) => void
}

export const ListAccessFallback: FC<ListAccessFallbackProps> = ({
  owner,
  access = {},
  shareOptions,
  currentUser,
}) => {
  const ownerUser = shareOptions.find((option) => option.name === owner)
  const {} = usePowerpack()
  return (
    <>
      {owner && ownerUser && (
        <AccessUser
          name={ownerUser.name || owner}
          label={ownerUser.label || owner}
          isMe={currentUser?.name === owner}
          isOwner={true}
          shareType="user"
        />
      )}
      <AccessUser name={EVERYONE_GROUP_KEY} label="Everyone" icon={'groups'}>
        <span className="suffix">{ACCESS_LEVEL_LABELS[access[EVERYONE_GROUP_KEY] || 10]}</span>
      </AccessUser>
      <PowerpackButton
        feature="listAccess"
        label="Manage list access"
        filled
        style={{ marginTop: 8, width: '100%' }}
      />
    </>
  )
}
