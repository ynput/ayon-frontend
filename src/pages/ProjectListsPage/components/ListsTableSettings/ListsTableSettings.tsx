import { useListsAttributesContext } from '@pages/ProjectListsPage/context/lists-attributes'
import { FC } from 'react'
import { toast } from 'react-toastify'
import { ProjectTableSettings } from '@shared/components'
import { SettingHighlightedId, useSettingsPanel } from '@shared/context'
import { confirmDelete } from '@shared/util'
import { useListsModuleContext } from '@pages/ProjectListsPage/context/lists-modules'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'
import type { ParentColumnDefinition } from '@shared/containers'
import { useListValuesContext } from '@pages/ProjectListsPage/context/list-values'
import { useListItemsDataContext } from '@pages/ProjectListsPage/context/list-items-data'

export interface ListsTableSettingsProps {
  onGoTo: (name: string) => void
  extraColumns: { value: string; label: string }[]
  parentColumns: ParentColumnDefinition[]
  columnIdAliases: Record<string, string>
  highlightedSetting: SettingHighlightedId
}

export const ListsTableSettings: FC<ListsTableSettingsProps> = ({
  onGoTo,
  extraColumns,
  parentColumns,
  columnIdAliases,
  highlightedSetting,
}) => {
  const { selectedList, isReview } = useListsContext()
  const { listAttributes, entityAttribFields, updateAttributes, isUpdating, isLoadingNewList } =
    useListsAttributesContext()
  const { ListsAttributesSettings, requiredVersion } = useListsModuleContext()
  const { selectSetting } = useSettingsPanel()
  const { module: listValues, isPowerFeature } = useListValuesContext()
  const { listValuesSettings, setListValuesSettings } = useListItemsDataContext()

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
      parentColumns={parentColumns}
      columnIdAliases={columnIdAliases}
      extraMenuItems={[
        {
          id: 'list-attributes',
          label: 'Create list attribute',
          icon: 'add',
          onClick: () => selectSetting('list_attributes'),
        },
      ]}
      highlighted={highlightedSetting}
      hiddenSettings={['group-by']}
      hideSortBy={isReview}
      settings={[
        // compare view (powerpack list values), stored with the view
        ...(isPowerFeature
          ? [
              {
                id: 'compare',
                title: 'Compare',
                icon: 'compare_arrows',
                preview: listValues.getCompareSettingsPreview(listValuesSettings),
                component: (
                  <listValues.CompareSettings
                    settings={listValuesSettings}
                    onChange={setListValuesSettings}
                  />
                ),
              },
            ]
          : []),
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
