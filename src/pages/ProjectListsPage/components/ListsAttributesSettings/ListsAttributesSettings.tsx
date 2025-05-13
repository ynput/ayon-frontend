import {
  ListsAttributesContextValue,
  useListsAttributesContext,
} from '@pages/ProjectListsPage/context/ListsAttributesContext'
import { FC, useState } from 'react'
import * as Styled from './ListsAttributesSettings.styled'
import { Button, Icon } from '@ynput/ayon-react-components'
import { SettingsPanelItemTemplate } from '@shared/components'
import { getAttributeIcon } from '@shared/util'
import styled from 'styled-components'
import AttributeEditor, { AttributeForm } from '@containers/attributes/AttributeEditor'

const SettingsPanelItemTemplateStyled = styled(SettingsPanelItemTemplate)`
  cursor: pointer;

  /* hide edit icon by default */
  [icon='edit'] {
    opacity: 0;
    margin-right: 4px;
  }
  &:hover {
    /* show edit icon on hover */
    [icon='edit'] {
      opacity: 1;
    }
  }
`

export interface ListsAttributesSettingsProps {}

export const ListsAttributesSettings: FC<ListsAttributesSettingsProps> = ({}) => {
  const { listAttributes, updateAttribute, isUpdating } = useListsAttributesContext()

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

  return (
    <>
      <Styled.Container>
        <Button icon={'add'} label="Add attribute" onClick={() => setAttributeFormOpen(null)} />
        <Styled.Items>
          {listAttributes?.map((attribute) => (
            <SettingsPanelItemTemplateStyled
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
              endContent={<Icon icon="edit" />}
              onClick={() => setAttributeFormOpen(attribute)}
            />
          ))}
        </Styled.Items>
      </Styled.Container>
      {attributeFormOpen !== undefined && (
        <AttributeEditor
          attribute={attributeFormOpen}
          existingNames={listAttributes.map((a) => a.name)}
          excludes={['scope', 'name']}
          onHide={() => setAttributeFormOpen(undefined)}
          onEdit={handleUpdateAttribute}
          isUpdating={isUpdating}
          error={attributesUpdateError}
        />
      )}
    </>
  )
}
