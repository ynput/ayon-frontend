import { FC } from 'react'
import * as Styled from './TableSettings.styled'
import { SettingsPanelItem } from '../SettingsPanel'
import styled from 'styled-components'
import { ColumnSettingsContextType, useColumnSettingsContext } from '@shared/containers'
import { Button, Icon } from '@ynput/ayon-react-components'

const FieldsItem = styled.li`
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
`

const FieldButton = styled(Button)`
  width: 100%;
  justify-content: start;
`

interface GroupSettingsProps {
  fields: SettingsPanelItem[]
  onChange?: ColumnSettingsContextType['updateGroupBy']
}

const GroupSettings: FC<GroupSettingsProps> = ({ fields, onChange }) => {
  const { columnOrder, groupBy, updateGroupBy } = useColumnSettingsContext()

  //   sort the fields based on the column order
  const sortedFields = fields.sort((a, b) => {
    const indexA = columnOrder.indexOf(a.value)
    const indexB = columnOrder.indexOf(b.value)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  const handleChange: ColumnSettingsContextType['updateGroupBy'] = (group) => {
    updateGroupBy(group)
    if (onChange) {
      onChange(group)
    }
  }

  return (
    <Styled.Menu>
      <FieldsItem>
        <FieldButton
          icon="close"
          variant="text"
          onClick={() => handleChange(undefined)}
          disabled={!groupBy}
        >
          None
        </FieldButton>
      </FieldsItem>
      {sortedFields.map((field) => (
        <FieldsItem key={field.value}>
          <FieldButton
            variant="text"
            selected={groupBy?.id === field.value}
            onClick={() => handleChange({ id: field.value, desc: false })}
            icon={field.icon}
          >
            {field.label}
            {groupBy?.id === field.value && <Icon icon="check" style={{ marginLeft: 'auto' }} />}
          </FieldButton>
        </FieldsItem>
      ))}
    </Styled.Menu>
  )
}

export default GroupSettings
