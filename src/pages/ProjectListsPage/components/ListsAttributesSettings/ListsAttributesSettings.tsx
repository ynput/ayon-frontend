import {
  ListsAttributesContextValue,
  useListsAttributesContext,
} from '@pages/ProjectListsPage/context/ListsAttributesContext'
import React, { FC, useState } from 'react'
import * as Styled from './ListsAttributesSettings.styled'
import { Button } from '@ynput/ayon-react-components'
import { getAttributeIcon, getPlatformShortcutKey, KeyMode } from '@shared/util'
import AttributeEditor, { AttributeForm } from '@containers/attributes/AttributeEditor'

export interface ListsAttributesSettingsProps {}

export const ListsAttributesSettings: FC<ListsAttributesSettingsProps> = ({}) => {
  const { listAttributes, updateAttribute, deleteAttribute, isUpdating, isLoadingNewList } =
    useListsAttributesContext()

  const [attributeFormOpen, setAttributeFormOpen] = useState<undefined | AttributeForm | null>()
  const [attributesUpdateError, setAttributesUpdateError] = useState<string | undefined>(undefined)

  const handleUpdateAttribute: ListsAttributesContextValue['updateAttribute'] = async (
    attribute,
  ) => {
    try {
      await updateAttribute(attribute)
      // hide the form after updating
      setAttributeFormOpen(undefined)
      setAttributesUpdateError(undefined)
    } catch (error: any) {
      setAttributesUpdateError(error)
    }
  }

  const handleDeleteAttribute = (e: React.MouseEvent<HTMLButtonElement>, name: string) => {
    e.stopPropagation()
    deleteAttribute(name, e.ctrlKey || e.metaKey)
  }

  return (
    <>
      <Styled.Container>
        <Button
          icon={'add'}
          label="Add attribute"
          onClick={() => setAttributeFormOpen(null)}
          disabled={isLoadingNewList}
        />
        <Styled.Items>
          {!isLoadingNewList
            ? listAttributes?.map((attribute) => (
                <Styled.SettingsPanelItemTemplate
                  key={attribute.name}
                  item={{
                    value: attribute.name,
                    label: attribute.data.title || attribute.name,
                    icon: getAttributeIcon(
                      attribute.name,
                      attribute.data.type,
                      !!attribute.data.enum?.length,
                    ),
                  }}
                  actions={[
                    {
                      icon: 'delete',
                      variant: 'danger',
                      onClick: (e) => handleDeleteAttribute(e, attribute.name),
                      // @ts-expect-error
                      ['data-tooltip']: `Delete without confirmation`,
                      ['data-shortcut']: getPlatformShortcutKey('', [KeyMode.Ctrl]),
                    },
                    {
                      icon: 'edit',
                    },
                  ]}
                  onClick={() => setAttributeFormOpen(attribute)}
                />
              ))
            : Array.from({ length: 5 }).map((_, index) => (
                <Styled.SettingsPanelItemTemplate
                  key={index}
                  item={{
                    value: 'loading...',
                    label: 'loading...',
                  }}
                  className="loading"
                />
              ))}
        </Styled.Items>
      </Styled.Container>
      {attributeFormOpen !== undefined && (
        <AttributeEditor
          attribute={attributeFormOpen}
          existingNames={listAttributes.map((a) => a.name)}
          excludes={['scope', 'name', 'builtin', 'position']}
          onHide={() => setAttributeFormOpen(undefined)}
          onEdit={handleUpdateAttribute}
          isUpdating={isUpdating}
          error={attributesUpdateError}
        />
      )}
    </>
  )
}
