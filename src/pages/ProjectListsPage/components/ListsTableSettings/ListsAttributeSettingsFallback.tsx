import { ListsAttributesContextValue } from '@pages/ProjectListsPage/context/ListsAttributesContext'
import { ConfirmDeleteOptions } from '@shared/util'
import { FC } from 'react'

export interface ListsAttributeSettingsFallbackProps {
  listAttributes: ListsAttributesContextValue['listAttributes']
  entityAttribFields: ListsAttributesContextValue['entityAttribFields']
  isLoadingNewList: ListsAttributesContextValue['isLoadingNewList']
  isUpdating: ListsAttributesContextValue['isUpdating']
  updateAttributes: ListsAttributesContextValue['updateAttributes']
  onGoTo: (name: string) => void
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
  confirmDelete?: (options: ConfirmDeleteOptions) => void
}

const ListsAttributeSettingsFallback: FC<ListsAttributeSettingsFallbackProps> = ({}) => {
  return <div>ListsAttributeSettingsFallback</div>
}

export default ListsAttributeSettingsFallback
