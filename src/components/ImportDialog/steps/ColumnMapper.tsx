import { DefaultItemTemplate, DefaultValueTemplate, DropdownProps, Icon, InputSwitch, InputText } from "@ynput/ayon-react-components"
import { useMemo } from "react"
import {
  MappersTableBodyRow,
  MappersTableBodyCell,
  MappersTableColumnName,
  MappersTableAttribute,
  MappersTableErrorHandling,
  PickActionDropdown,
  MapperDropdown,
  TargetType,
  DropdownValueLabel,
  MappingError,
  SwitchWrapper,
} from "./common.styled"
import { ColumnAction, ErrorHandlingMode, TargetColumn, TargetValue, ValueAction } from "./common"
import clsx from "clsx"
import { ImportableColumn } from "@shared/api/generated/dataImport"

export enum MappingState {
  UNRESOLVED = "unresolved",
  RESOLVED = "resolved",
  AUTO_RESOLVED = "autoresolved",
  ERROR = "error",
}

type Props = {
  state: MappingState
  selected: boolean
  column: string
  action: ColumnAction | ValueAction | undefined
  actions: DropdownProps["options"]
  target: TargetColumn | TargetValue | undefined
  targetOptions: DropdownProps["options"]
  errorHandlingEnabled?: boolean
  errorHandling: ErrorHandlingMode | undefined
  errorHandlingOptions: DropdownProps["options"]
  valueType?: ImportableColumn["valueType"]
  onPointerEnter: () => void
  onClick: (ctrl: boolean, shift: boolean) => void
  onActionChange: (action: ColumnAction | ValueAction) => void
  onTargetChange: (target: TargetValue) => void
  onErrorHandlingChange: (mode: ErrorHandlingMode) => void
}

export const TARGET_OPTION_MAPPING_SEPARATOR = ' - '

export const humanReadableDataType: Record<string, string> = {
  "string": "Text",
  "enum": "Select",
  "list_of_strings": "Multi-select",
  "list_of_any": "Multi-select",
  "list_of_dict": "Multi-select",
  "list_of_integers": "Multi-select (whole number)",
  "list_of_submodels": "Multi-select",
  "integer": "Whole Number",
  "float": "Number with decimals",
  "datetime": "Date and time",
  "boolean": "True/False",
}

const formatDataType = (t: string, isEnum: boolean) => {
  if (isEnum) {
    return humanReadableDataType["enum"]
  }

  return humanReadableDataType[t] ?? t.replace(/_/g, ' ')
}

export default function ColumnMapper({
  state,
  selected,
  column,
  action,
  actions,
  target,
  targetOptions,
  errorHandling,
  errorHandlingOptions,
  errorHandlingEnabled = true,
  valueType,
  onPointerEnter,
  onClick,
  onActionChange,
  onTargetChange,
  onErrorHandlingChange,
}: Props) {
  const selectedActionOption = useMemo(
    () => actions.find(({ value }) => value === action),
    [actions, action]
  )
  const selectedTargetOption = useMemo(
    () => targetOptions.find(({ value }) => value === target),
    [targetOptions, target]
  )

  const mapping = action === ValueAction.MAP || action === ColumnAction.MAP
  const skipping = action === ColumnAction.SKIP
  const creating = action === ValueAction.CREATE

  return (
    <MappersTableBodyRow
      className={clsx({ selected })}
      onPointerEnter={() => onPointerEnter()}
      onClick={(event) => onClick(event.ctrlKey, event.shiftKey)}
    >
      <MappersTableColumnName className={clsx([state], { empty: column === undefined })} scope="row">
        {column ?? "(empty)"}
      </MappersTableColumnName>
      <MappersTableBodyCell>
        <PickActionDropdown
          value={action ? [action] : []}
          options={actions}
          valueTemplate={(value, selected, isOpen) => (
            <DefaultValueTemplate
              value={value}
              displayIcon={selectedActionOption?.icon}
              isOpen={isOpen}
              placeholder="Pick action..."
            >
              {selectedActionOption?.label}
            </DefaultValueTemplate>
          )}
          onChange={([value]) => onActionChange(value as ColumnAction)}
        />
      </MappersTableBodyCell>
      <MappersTableAttribute>
        {
          mapping
          ? (
            valueType === "boolean"
            ? (
              <SwitchWrapper>
                <InputSwitch
                  checked={target as boolean}
                  onChange={(event) => onTargetChange((event.target as HTMLInputElement).checked)}
                />
                { target ? "Yes" : "No" }
              </SwitchWrapper>
            ) : (
              <MapperDropdown
                disabled={targetOptions.length === 0}
                value={target && !(skipping || creating) ? [target as string] : []}
                options={targetOptions}
                onChange={([value]) => onTargetChange(value)}
                valueTemplate={(value, selected, isOpen) => (
                  <DefaultValueTemplate
                    value={value}
                    displayIcon={undefined}
                    isOpen={isOpen}
                    placeholder={
                      targetOptions.length === 0
                        ? "Nothing to map. Try choosing the Create or Skip action."
                        : "Select a target..."
                    }
                  >
                    <DropdownValueLabel>
                      {selectedTargetOption?.label.split(TARGET_OPTION_MAPPING_SEPARATOR).at(0)}
                      <TargetType>
                        {formatDataType(selectedTargetOption?.type ?? "", selectedTargetOption?.isEnum)}
                      </TargetType>
                    </DropdownValueLabel>
                  </DefaultValueTemplate>
                )}
                itemTemplate={(option) => (
                  <DefaultItemTemplate
                    option={option}
                    dataKey="value"
                    labelKey="label"
                    value={option.value}
                    endContent={
                      option.type
                        ? <TargetType>{formatDataType(option.type, option.isEnum)}</TargetType>
                        : undefined
                    }
                  />
                )}
              />
            )
          ) : (
            <InputText
              value={target as string}
              disabled={skipping}
              onChange={(event) => onTargetChange(event.target.value)}
              placeholder={
                skipping
                  ? "Will be skipped"
                  : "Enter a value"
              }
            />
          )
        }
        {state === MappingState.ERROR && (
          <MappingError>
            <Icon icon="error" />
            Invalid value
          </MappingError>
        )}
      </MappersTableAttribute>
      {
        errorHandlingEnabled && (
          <MappersTableErrorHandling>
            <MapperDropdown
              disabled={skipping || creating || !target}
              value={errorHandling && !skipping ? [errorHandling] : []}
              options={errorHandlingOptions}
              onChange={([value]) => onErrorHandlingChange(value as ErrorHandlingMode)}
              placeholder={
                skipping
                ? "Will be skipped"
                : creating ? "A new value will be created" : "Choose error handling..."
              }
            />
          </MappersTableErrorHandling>
        )
      }
    </MappersTableBodyRow>
  )
}
