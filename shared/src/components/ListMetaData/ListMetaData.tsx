// displays the meta data for a list

import type { EntityListModel } from '@shared/api'
import { formatDateTime } from '@shared/util'
import { FC } from 'react'
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

  const metaData = {
    Id: list?.id,
    'Entity type': list?.entityType,
    'List type': list?.entityListType,
    'Items count': list?.data?.count ?? list?.items?.length,
    Owner: list?.owner,
    'Created at': list?.createdAt && formatDateTime(list.createdAt),
    'Created by': list?.createdBy,
    'Updated at': list?.updatedAt && formatDateTime(list.updatedAt),
    'Last updated by': list?.updatedBy,
    ...listData,
  }

  const fields = Object.keys(metaData).map((key) => ({
    name: key,
    data: { type: 'string' as 'string' },
    hidden: false,
  }))

  return <DetailsSection form={metaData} fields={fields} isLoading={!!isLoading} />
}
