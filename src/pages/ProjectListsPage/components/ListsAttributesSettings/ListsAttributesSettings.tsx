import React, { FC, useCallback, useState } from 'react'
import * as Styled from './ListsAttributesSettings.styled'
import { Button } from '@ynput/ayon-react-components'
import { confirmDelete, getAttributeIcon, getPlatformShortcutKey, KeyMode } from '@shared/util'
import type { EntityListAttributeDefinition } from '@shared/api'
import { AttributeEditor, AttributeForm } from '@shared/components'

type ListsAttributesContextValue = {
  listAttributes: EntityListAttributeDefinition[]
  entityAttribFields: string[]
  isLoading: boolean
  isUpdating: boolean
  isLoadingNewList: boolean
  updateAttributes: (attribute: EntityListAttributeDefinition[]) => Promise<void>
}

export interface ListsAttributesSettingsProps {
  listAttributes: ListsAttributesContextValue['listAttributes']
  entityAttribFields: ListsAttributesContextValue['entityAttribFields']
  isLoadingNewList: ListsAttributesContextValue['isLoadingNewList']
  isUpdating: ListsAttributesContextValue['isUpdating']
  updateAttributes: ListsAttributesContextValue['updateAttributes']
  onGoTo: (name: string) => void
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export const ListsAttributesSettings: FC<ListsAttributesSettingsProps> = ({
  listAttributes,
  entityAttribFields,
  isUpdating,
  isLoadingNewList,
  onGoTo,
  updateAttributes,
  onSuccess,
  onError,
}) => {
  const [attributeFormOpen, setAttributeFormOpen] = useState<undefined | AttributeForm | null>()
  const [attributesUpdateError, setAttributesUpdateError] = useState<string | undefined>(undefined)

  const deleteAttribute = async (name: string) => {
    try {
      const updatedAttributes = listAttributes.filter((attr) => attr.name !== name)

      await updateAttributes(updatedAttributes)
      onSuccess?.('Attribute deleted successfully')
    } catch (error: any) {
      console.error('Error deleting attribute:', error)
      onError?.(error)
      throw error
    }
  }

  const onDeleteAttribute = useCallback(async (name: string, force?: boolean) => {
    if (force) {
      return await deleteAttribute(name)
    } else {
      confirmDelete({
        title: 'attribute',
        message: `Are you sure you want to delete the attribute "${name}"?`,
        accept: async () => {
          return await deleteAttribute(name)
        },
        showToasts: false,
      })
    }
  }, [])

  const onUpdateAttribute = async (attribute: EntityListAttributeDefinition) => {
    try {
      let updatedAttributes: EntityListAttributeDefinition[]
      const existingAttributeIndex = listAttributes.findIndex(
        (attr) => attr.name === attribute.name,
      )

      if (existingAttributeIndex !== -1) {
        // Attribute exists, update it
        updatedAttributes = listAttributes.map((attr, index) => {
          if (index === existingAttributeIndex) {
            return {
              ...attr,
              ...attribute,
            }
          }
          return attr
        })
      } else {
        // Attribute does not exist, add it
        updatedAttributes = [...listAttributes, attribute]
      }

      await updateAttributes(updatedAttributes)
      onSuccess?.('Attribute updated successfully')
    } catch (error: any) {
      console.error('Error updating attribute:', error)
      onError?.(error)
      throw error
    }
  }

  const handleUpdateAttribute = async (attribute: EntityListAttributeDefinition) => {
    try {
      await onUpdateAttribute(attribute)
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
      await onDeleteAttribute(name, e?.ctrlKey || e?.metaKey)

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
