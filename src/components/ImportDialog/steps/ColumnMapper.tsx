import { DefaultValueTemplate, DropdownProps } from "@ynput/ayon-react-components"
import { useMemo } from "react"
import {
  MappersTableBodyRow,
  MappersTableBodyCell,
  MappersTableColumnName,
  MappersTableAttribute,
  MappersTableErrorHandling,
  PickActionDropdown,
  MapperDropdown
} from "./common.styled"
import { ColumnAction, ErrorHandlingMode } from "./common"
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
  action: ColumnAction | undefined
  actions: DropdownProps["options"]
  target: string | undefined
  targetOptions: DropdownProps["options"]
  errorHandlingEnabled?: boolean
  errorHandling: ErrorHandlingMode | undefined
  errorHandlingOptions: DropdownProps["options"]
  onPointerEnter: () => void
  onActionChange: (action: ColumnAction) => void
  onTargetChange: (target: string) => void
  onErrorHandlingChange: (mode: ErrorHandlingMode) => void
}

export const TARGET_OPTION_MAPPING_SEPARATOR = ' - '

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
  const creating = action === ColumnAction.CREATE

  return (
    <MappersTableBodyRow
      className={clsx({ selected })}
      onPointerEnter={() => onPointerEnter()}
    >
      <MappersTableColumnName className={clsx([state])} scope="row">
        {column}
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
        <MapperDropdown
          disabled={skipping || creating}
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
                    : "Select a target..."
              }
            >
              {selectedTargetOption?.label.split(TARGET_OPTION_MAPPING_SEPARATOR).at(0)}
            </DefaultValueTemplate>
          )}
        />
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
