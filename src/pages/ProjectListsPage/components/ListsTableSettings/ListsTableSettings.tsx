import { useListsAttributesContext } from '@pages/ProjectListsPage/context/ListsAttributesContext'
import { useLoadModule } from '@shared/hooks'
import { FC } from 'react'
import { toast } from 'react-toastify'
import ListsAttributeSettingsFallback from './ListsAttributeSettingsFallback'
import { ProjectTableSettings } from '@shared/components'
import { SettingHighlightedId } from '@shared/context'
import { confirmDelete } from '@shared/util'

export interface ListsTableSettingsProps {
  onGoTo: (name: string) => void
  extraColumns: { value: string; label: string }[]
  highlightedSetting: SettingHighlightedId
}

export const ListsTableSettings: FC<ListsTableSettingsProps> = ({
  onGoTo,
  extraColumns,
  highlightedSetting,
}) => {
  const { listAttributes, entityAttribFields, updateAttributes, isUpdating, isLoadingNewList } =
    useListsAttributesContext()

  const onSuccess = (message: string) => {
    toast.success(message)
  }
  const onError = (error: string) => {
    toast.error(error)
  }

  const [ListsAttributesSettings] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListsAttributesSettings',
    fallback: ListsAttributeSettingsFallback,
  })
  return (
    <ProjectTableSettings
      extraColumns={extraColumns}
      highlighted={highlightedSetting}
      settings={[
        {
          id: 'list_attributes',
          title: 'List attributes',
          icon: 'text_fields',
          preview: listAttributes.length,
          component: (
            <ListsAttributesSettings
              listAttributes={listAttributes}
              entityAttribFields={entityAttribFields}
              updateAttributes={updateAttributes}
              isUpdating={isUpdating}
              isLoadingNewList={isLoadingNewList}
              onGoTo={onGoTo}
              onSuccess={onSuccess}
              onError={onError}
              confirmDelete={confirmDelete}
            />
          ),
        },
      ]}
    />
  )
}
