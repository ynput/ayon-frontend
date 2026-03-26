import { DefaultItemTemplate, DefaultValueTemplate, DropdownProps, InputText } from "@ynput/ayon-react-components"
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
  DropdownValueLabel
} from "./common.styled"
import { ColumnAction, ErrorHandlingMode, ValueAction } from "./common"
import clsx from "clsx"

export enum MappingState {
  UNRESOLVED = "unresolved",
  RESOLVED = "resolved",
  AUTO_RESOLVED = "autoresolved",
}

type Props = {
  state: MappingState
  selected: boolean
  column: string
  action: ColumnAction | ValueAction | undefined
  actions: DropdownProps["options"]
  target: string | undefined
  targetOptions: DropdownProps["options"]
  errorHandlingEnabled?: boolean
  errorHandling: ErrorHandlingMode | undefined
  errorHandlingOptions: DropdownProps["options"]
  onPointerEnter: () => void
  onClick: (ctrl: boolean, shift: boolean) => void
  onActionChange: (action: ColumnAction | ValueAction) => void
  onTargetChange: (target: string) => void
  onErrorHandlingChange: (mode: ErrorHandlingMode) => void
}

export const TARGET_OPTION_MAPPING_SEPARATOR = ' - '

const formatDataType = (t: string) => t.replace(/_/g, ' ')

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
          action === ValueAction.CREATE
          ? (
            <InputText
              value={target}
              onChange={(event) => onTargetChange(event.target.value)}
              placeholder="Enter a value"
            />
          ) : (
            <MapperDropdown
              disabled={skipping || creating || targetOptions.length === 0}
              value={target && !(skipping || creating) ? [target] : []}
              options={targetOptions}
              onChange={([value]) => onTargetChange(value)}
              valueTemplate={(value, selected, isOpen) => (
                <DefaultValueTemplate
                  value={value}
                  displayIcon={undefined}
                  isOpen={isOpen}
                  placeholder={
                    skipping
                      ? "Will be skipped"
                      : creating
                        ? "A new value will be created"
                        : targetOptions.length === 0
                          ? "Nothing to map. Try choosing the Create or Skip action."
                          : "Select a target..."
                  }
                >
                  <DropdownValueLabel>
                    {selectedTargetOption?.label.split(TARGET_OPTION_MAPPING_SEPARATOR).at(0)}
                    <TargetType>{formatDataType(selectedTargetOption?.type ?? "")}</TargetType>
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
                      ? <TargetType>{formatDataType(option.type)}</TargetType>
                      : undefined
                  }
                />
              )}
            />
          )
        }
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
