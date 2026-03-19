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
          disabled={skipping}
          value={target && !skipping ? [target] : []}
          options={targetOptions}
          onChange={([value]) => onTargetChange(value)}
          placeholder={
            skipping
              ? "Will be skipped"
              : "Select a target..."
          }
          valueTemplate={(value, selected, isOpen) => (
            <DefaultValueTemplate
              value={value}
              displayIcon={undefined}
              isOpen={isOpen}
              placeholder="Select a target..."
            >
              {selectedTargetOption?.label.split(TARGET_OPTION_MAPPING_SEPARATOR).at(0)}
            </DefaultValueTemplate>
          )}
        />
      </MappersTableAttribute>
      <MappersTableErrorHandling>
        <MapperDropdown
          disabled={skipping || !target}
          value={errorHandling && !skipping ? [errorHandling] : []}
          options={errorHandlingOptions}
          onChange={([value]) => onErrorHandlingChange(value as ErrorHandlingMode)}
          placeholder={
            skipping
            ? "Will be skipped"
            : "Choose error handling..."
          }
        />
      </MappersTableErrorHandling>
    </MappersTableBodyRow>
  )
}
