import { DefaultValueTemplate, Dropdown, DropdownProps } from "@ynput/ayon-react-components"
import { useMemo } from "react"

import {
  MappersTableBodyRow,
  MappersTableBodyCell,
  MappersTableColumnName,
  MappersTableAttribute,
  MappersTableErrorHandling,
  PickActionDropdown
} from "./MapColumnsStep.styled"
import { ColumnAction } from "../common"
import clsx from "clsx"

export enum MappingState {
  UNRESOLVED = "unresolved",
  RESOLVED = "resolved",
  ERROR = "error",
}

type Props = {
  state: MappingState
  selected: boolean
  column: string
  action: DropdownProps["value"]
  actions: DropdownProps["options"]
  attributeOptions: DropdownProps["options"]
  errorHandlingOptions: DropdownProps["options"]
  onClick: () => void
  onActionChange: (action: ColumnAction) => void
}

export default function ColumnMapper({
  state,
  selected,
  column,
  action,
  actions,
  attributeOptions,
  errorHandlingOptions,
  onClick,
  onActionChange,
}: Props) {
  const selectedActionOption = useMemo(
    () => actions.find(({ value }) => value === action?.[0]),
    [actions, action]
  )

  const skipping = action?.[0] === ColumnAction.SKIP

  return (
    <MappersTableBodyRow
      className={clsx({ selected })}
      onClick={() => onClick()}
    >
      <MappersTableColumnName className={clsx([state])}>
        {column}
      </MappersTableColumnName>
      <MappersTableBodyCell>
        <PickActionDropdown
          value={action}
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
        <Dropdown
          disabled={skipping}
          value={[]}
          options={attributeOptions}
          placeholder={
            skipping
              ? "Will be skipped"
              : "Select an attribute..."
          }
        />
      </MappersTableAttribute>
      <MappersTableErrorHandling>
        <Dropdown
          disabled={skipping}
          value={[]}
          options={errorHandlingOptions}
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
