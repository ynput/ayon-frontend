import { useProjectTableContext } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import { DefaultItemTemplate, Dropdown, DropdownRef, Icon } from '@ynput/ayon-react-components'
import { FC, useRef, useState } from 'react'
import styled from 'styled-components'

const StyledCustomizeDropdown = styled(Dropdown)`
  min-width: 120px;
  .button {
    background-color: var(--md-sys-color-surface-container-highest);
    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
    display: flex;
    gap: var(--base-gap-small);
    align-items: center;
    justify-content: center;
  }
`

const StyledSettingItem = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  height: 32px;
  padding-left: var(--padding-m);

  .label {
    flex: 1;
    min-width: 70px;
  }

  .icon {
    padding-right: var(--padding-m);
  }

  &:not(:hover) {
    .status,
    [icon='chevron_right'] {
      color: var(--md-sys-color-outline);
    }
  }
`

const InvisibleDropdown = styled(Dropdown)`
  position: absolute;
  right: 0;
  width: 120px;
  visibility: hidden;
`

type SettingField = 'fields'

const ProjectOverviewSettings: FC = ({}) => {
  const { columnVisibility, setColumnVisibility, attribFields } = useProjectTableContext()

  const [selectedSetting, setSelectedSetting] = useState<SettingField | null>(null)

  const columns = [
    {
      value: 'status',
      label: 'Status',
    },
    {
      value: 'subType',
      label: 'Type',
    },
    {
      value: 'assignees',
      label: 'Assignees',
    },
    {
      value: 'tags',
      label: 'Tags',
    },
    ...attribFields.map((field) => ({
      value: field.name,
      label: field.data.title || field.name,
    })),
  ]

  const columnVisibilityValue = columns
    .map((column) => column.value)
    .filter((key) => columnVisibility[key] !== false)

  const columnsRef = useRef<DropdownRef>(null)

  const settingsOptions = [
    {
      value: 'fields',
      label: 'Fields',
      icon: 'text_fields',
      status: `${
        Object.keys(columnVisibility).filter((key) => columnVisibility[key]).length
      } shown`,
    },
  ]

  return (
    <>
      <StyledCustomizeDropdown
        options={settingsOptions}
        align="right"
        value={[]}
        valueTemplate={() => (
          <>
            <Icon icon={selectedSetting ? 'chevron_left' : 'settings'} />
            <span>
              {settingsOptions.find((s) => s.value === selectedSetting)?.label || 'Customize'}
            </span>
          </>
        )}
        itemTemplate={(option) => (
          <StyledSettingItem>
            <Icon icon={option.icon} />
            <span className="label">{option.label}</span>
            {option.status && <span className="status">{option.status}</span>}
            <Icon icon="chevron_right" />
          </StyledSettingItem>
        )}
        onChange={(value) => {
          setSelectedSetting(value[0] as SettingField)
          //   open the dropdown
          columnsRef.current?.open()
        }}
        onClose={() => setSelectedSetting(null)}
        widthExpand={false}
      />
      <InvisibleDropdown
        multiSelect
        options={columns}
        ref={columnsRef}
        value={columnVisibilityValue}
        onChange={(value) => {
          const newVisibility = columns.reduce((acc: { [key: string]: boolean }, column) => {
            acc[column.value] = value.includes(column.value)
            return acc
          }, {})
          setColumnVisibility(newVisibility)
        }}
        style={{ minWidth: 200 }}
        maxHeight={600}
        maxOptionsShown={100}
        onClose={() => setSelectedSetting(null)}
        multipleOverride={true}
        itemTemplate={(option, _isActive, isSelected) => (
          <DefaultItemTemplate
            option={option}
            dataKey="value"
            labelKey="label"
            selected={isSelected ? [option.value] : []}
            value={isSelected ? [option.value] : []}
            endContent={isSelected && <Icon icon="check" style={{ marginLeft: 'auto' }} />}
          />
        )}
      />
    </>
  )
}

export default ProjectOverviewSettings
