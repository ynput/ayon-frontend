import { SettingsPanelItem, TableSettingsFallback } from '../../../components'
import { FC } from 'react'
import { ColumnSettingsContextType } from '../context'
import styled from 'styled-components'
import { Button, Icon } from '@ynput/ayon-react-components'

const FieldItem = styled.li`
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
`

const FieldButton = styled(Button)`
  width: 100%;
  justify-content: start;
`

export type GroupByConfig = {
  showEmpty?: boolean
}

export interface GroupSettingsProps {
  fields: SettingsPanelItem[]
  config?: GroupByConfig
  onChange?: ColumnSettingsContextType['updateGroupBy']
  groupBy?: ColumnSettingsContextType['groupBy']
  updateGroupBy?: ColumnSettingsContextType['updateGroupBy']
  onConfigChange?: (config: GroupByConfig) => void
}

export interface GroupSettingsFallbackProps extends GroupSettingsProps {
  requiredVersion?: string
}

export const GroupSettingsFallback: FC<GroupSettingsFallbackProps> = ({
  requiredVersion,
  fields,
}) => (
  <TableSettingsFallback feature={'groupAttributes'} requiredVersion={requiredVersion}>
    {fields.map((field) => (
      <FieldItem key={field.value}>
        <FieldButton variant="text" icon={field.icon}>
          {field.label}
          <Icon icon={'bolt'} style={{ marginLeft: 'auto' }} />
        </FieldButton>
      </FieldItem>
    ))}
  </TableSettingsFallback>
)
