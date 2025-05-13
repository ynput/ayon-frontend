import {
  ListsAttributesContextValue,
  useListsAttributesContext,
} from '@pages/ProjectListsPage/context/ListsAttributesContext'
import React, { FC, useState } from 'react'
import * as Styled from './ListsAttributesSettings.styled'
import { Button } from '@ynput/ayon-react-components'
import { getAttributeIcon, getPlatformShortcutKey, KeyMode } from '@shared/util'
import AttributeEditor, { AttributeForm } from '@containers/attributes/AttributeEditor'

export interface ListsAttributesSettingsProps {
  onGoTo: (name: string) => void
}

export const ListsAttributesSettings: FC<ListsAttributesSettingsProps> = ({ onGoTo }) => {
  const {
    listAttributes,
    entityAttribFields,
    updateAttribute,
    deleteAttribute,
    isUpdating,
    isLoadingNewList,
  } = useListsAttributesContext()

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

  const handleDeleteAttribute = async (
    e: React.MouseEvent<HTMLButtonElement> | undefined,
    name: string,
  ) => {
    e?.stopPropagation()
    try {
      await deleteAttribute(name, e?.ctrlKey || e?.metaKey)

      // if the editor is open, close it
      if (attributeFormOpen?.name === name) {
        setAttributeFormOpen(undefined)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleGoTo = (e: React.MouseEvent<HTMLButtonElement> | undefined, name: string) => {
    e?.stopPropagation()
    onGoTo(name)
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
                      ['data-tooltip']: `To delete without confirmation hold`,
                      ['data-shortcut']: getPlatformShortcutKey('', [KeyMode.Ctrl]),
                      onClick: (e) => handleDeleteAttribute(e, attribute.name),
                    },
                    {
                      icon: 'edit',
                      ['data-tooltip']: `Edit`,
                    },
                    {
                      icon: 'arrow_forward',
                      ['data-tooltip']: `Go to in list`,
                      onClick: (e) => handleGoTo(e, attribute.name),
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
          existingNames={[...listAttributes.map((a) => a.name), ...entityAttribFields]}
          excludes={['scope', 'name', 'builtin', 'position']}
          onHide={() => setAttributeFormOpen(undefined)}
          onEdit={handleUpdateAttribute}
          isUpdating={isUpdating}
          error={attributesUpdateError}
          onDelete={() =>
            attributeFormOpen && handleDeleteAttribute(undefined, attributeFormOpen?.name)
          }
        />
      )}
    </>
  )
}
