import { useListsAttributesContext } from '@pages/ProjectListsPage/context/ListsAttributesContext'
import { FC } from 'react'
import { toast } from 'react-toastify'
import { ProjectTableSettings } from '@shared/components'
import { SettingHighlightedId } from '@shared/context'
import { confirmDelete } from '@shared/util'
import { useListsModuleContext } from '@pages/ProjectListsPage/context/ListsModulesContext'

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
  const { ListsAttributesSettings, requiredVersion } = useListsModuleContext()

  const onSuccess = (message: string) => {
    toast.success(message)
  }
  const onError = (error: string) => {
    toast.error(error)
  }

  return (
    <ProjectTableSettings
      extraColumns={extraColumns}
      hiddenColumns={['folder']}
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
              requiredVersion={requiredVersion.settings}
            />
          ),
        },
      ]}
    />
  )
}
