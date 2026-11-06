// displays the meta data for a list

import type { EntityListModel } from '@shared/api'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { formatDateTime } from '@shared/util'
import { FC, useMemo } from 'react'
import { DetailsSection } from '../DetailsPanelDetails'

interface ListMetaDataProps {
  list?: EntityListModel
  isLoading?: boolean
}

export const ListMetaData: FC<ListMetaDataProps> = ({ list, isLoading }) => {
  // data also holds structured entries (list attribute definitions, review session
  // sections/grouping) which have no meaningful string rendering, and the thumbnail hash
  const listData = Object.fromEntries(
    Object.entries(list?.data || {}).filter(
      ([key, value]) =>
        !['category', 'count', 'thumbnail'].includes(key) &&
        value !== null &&
        typeof value !== 'object',
    ),
  )

  // users by their full name; the user name until it loads, or when they have none
  const userNames = useMemo(
    () =>
      Array.from(new Set([list?.owner, list?.createdBy, list?.updatedBy])).filter(
        (name): name is string => !!name,
      ),
    [list?.owner, list?.createdBy, list?.updatedBy],
  )
  const { data: users = [] } = useGetUsersAssigneeQuery(
    { names: userNames },
    { skip: !userNames.length },
  )
  const getUserLabel = (name?: string | null) =>
    users.find((user) => user.name === name)?.fullName || name

  const metaData = {
    Owner: getUserLabel(list?.owner),
    'Created at': list?.createdAt && formatDateTime(list.createdAt),
    'Created by': getUserLabel(list?.createdBy),
    'Updated at': list?.updatedAt && formatDateTime(list.updatedAt),
    'Last updated by': getUserLabel(list?.updatedBy),
    'Entity type': list?.entityType,
    'List type': list?.entityListType,
    'Items count': list?.data?.count ?? list?.items?.length,
    ...listData,
    // last: the panel mutes it
    Id: list?.id,
  }

  const fields = Object.keys(metaData).map((key) => ({
    name: key,
    data: { type: 'string' as 'string' },
    hidden: false,
  }))

  return <DetailsSection form={metaData} fields={fields} isLoading={!!isLoading} />
}
