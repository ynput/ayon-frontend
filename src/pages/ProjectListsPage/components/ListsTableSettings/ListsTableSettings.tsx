import { useListsAttributesContext } from '@pages/ProjectListsPage/context/ListsAttributesContext'
import { FC } from 'react'
import { toast } from 'react-toastify'
import { ProjectTableSettings } from '@shared/components'
import { SettingHighlightedId } from '@shared/context'
import { confirmDelete } from '@shared/util'
import { useListsModuleContext } from '@pages/ProjectListsPage/context/ListsModulesContext'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'

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
  const { selectedList, isReview } = useListsContext()
  const { listAttributes, entityAttribFields, updateAttributes, isUpdating, isLoadingNewList } =
    useListsAttributesContext()
  const { ListsAttributesSettings, requiredVersion } = useListsModuleContext()

  // mirror the table's excluded columns so the panel doesn't offer dead toggles
  // (e.g. subType is excluded for version/product lists where productType is the real column)
  const [hiddenColumns] = getColumnConfigFromType(selectedList?.entityType)

  const onSuccess = (message: string) => {
    toast.success(message)
  }
  const onError = (error: string) => {
    toast.error(error)
  }

  return (
    <ProjectTableSettings
      extraColumns={extraColumns}
      hiddenColumns={hiddenColumns}
      highlighted={highlightedSetting}
      hiddenSettings={['group-by']}
      hideSortBy={isReview}
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
      scope={selectedList?.entityType}
    />
  )
}
