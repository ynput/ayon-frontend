// displays the meta data for a list

import { EntityListModel } from '@shared/api'
import { format } from 'date-fns'
import { FC } from 'react'
import { DetailsSection } from '../DetailsPanelDetails'

interface ListMetaDataProps {
  list?: EntityListModel
  isLoading?: boolean
}

export const ListMetaData: FC<ListMetaDataProps> = ({ list, isLoading }) => {
  const listData = { ...(list?.data || {}) }
  // remove category from the meta data
  delete listData.category

  const metaData = {
    Id: list?.id,
    'Entity type': list?.entityType,
    'List type': list?.entityListType,
    'Items count': list?.items?.length,
    Owner: list?.owner,
    'Created at': list?.createdAt && format(new Date(list?.createdAt), 'PPpp'),
    'Created by': list?.createdBy,
    'Updated at': list?.updatedAt && format(new Date(list?.updatedAt), 'PPpp'),
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
