import { useListsAttributesContext } from '@pages/ProjectListsPage/context/ListsAttributesContext'
import { FC } from 'react'
import { ListsAttributesSettings } from './ListsAttributesSettings'
import { toast } from 'react-toastify'

export interface ListsAttributesSettingsProps {
  onGoTo: (name: string) => void
}

export const ListsAttributesSettingsWrapper: FC<ListsAttributesSettingsProps> = ({ onGoTo }) => {
  const { listAttributes, entityAttribFields, updateAttributes, isUpdating, isLoadingNewList } =
    useListsAttributesContext()

  const onSuccess = (message: string) => {
    toast.success(message)
  }
  const onError = (error: string) => {
    toast.error(error)
  }

  return (
    <ListsAttributesSettings
      listAttributes={listAttributes}
      entityAttribFields={entityAttribFields}
      updateAttributes={updateAttributes}
      isUpdating={isUpdating}
      isLoadingNewList={isLoadingNewList}
      onGoTo={onGoTo}
      onSuccess={onSuccess}
      onError={onError}
    />
  )
}
