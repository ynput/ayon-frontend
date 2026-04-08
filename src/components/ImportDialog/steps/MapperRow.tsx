import {
  DefaultItemTemplate,
  DefaultValueTemplate,
  DropdownProps,
  Icon,
  InputSwitch,
  InputText,
} from "@ynput/ayon-react-components"
import { useMemo, CSSProperties } from "react"
import {
  MappersTableBodyRow,
  MappersTableBodyCell,
  MappersTableColumnName,
  MappersTableTarget,
  MappersTableErrorHandling,
  PickActionDropdown,
  MapperDropdown,
  TargetType,
  DropdownValueLabel,
  MappingError,
  SwitchWrapper,
  DropdownValueTemplate,
  MappersTableComment,
  MappersTableTargetInner,
} from "./common.styled"
import { ColumnAction, ErrorHandlingMode, TargetColumn, TargetValue, ValueAction } from "./common"
import clsx from "clsx"
import { ImportableColumn } from "@shared/api/generated/dataImport"
import { formatDataType } from "../utils"

export enum MappingState {
  UNRESOLVED = "unresolved",
  RESOLVED = "resolved",
  AUTO_RESOLVED = "autoresolved",
  ERROR = "error",
}

export const resolvedStates = new Set([
  MappingState.AUTO_RESOLVED,
  MappingState.RESOLVED,
])

type Props = {
  state: MappingState
  selected: boolean
  source: string
  comment?: string
  action: ColumnAction | ValueAction | undefined
  actions: DropdownProps["options"]
  target: TargetColumn | TargetValue | undefined
  targetOptions: DropdownProps["options"]
  errorHandlingEnabled?: boolean
  errorHandling: ErrorHandlingMode | undefined
  errorHandlingOptions: DropdownProps["options"]
  valueType?: ImportableColumn["valueType"]
  dropdownValueIcon?: boolean
  dependencies?: string[]
  onPointerEnter: () => void
  onClick: (ctrl: boolean, shift: boolean) => void
  onActionChange: (action: ColumnAction | ValueAction) => void
  onTargetChange: (target: TargetValue) => void
  onErrorHandlingChange: (mode: ErrorHandlingMode) => void
}

export const TARGET_OPTION_MAPPING_SEPARATOR = ' - '

export default function ColumnMapper({
  state,
  selected,
  source,
  comment,
  action,
  actions,
  target,
  targetOptions,
  errorHandling,
  errorHandlingOptions,
  errorHandlingEnabled = true,
  valueType,
  dropdownValueIcon = false,
  dependencies,
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
      onClick={(event) => onClick(event.ctrlKey || event.metaKey, event.shiftKey)}
    >
      <MappersTableColumnName className={clsx([state], { empty: source === undefined })} scope="row">
        {source ?? "(empty)"}
        {
          comment && <MappersTableComment>{comment}</MappersTableComment>
        }
      </MappersTableColumnName>
      <MappersTableBodyCell>
        <PickActionDropdown
          value={action ? [action] : []}
          options={actions}
          valueTemplate={(value, _, isOpen) => (
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
      <MappersTableTarget>
        <MappersTableTargetInner>
          {
            mapping || !action
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
                  searchOnNumber={10}
                  onChange={([value]) => onTargetChange(value)}
                  valueTemplate={(value, _, isOpen) => (
                    <DropdownValueTemplate
                      value={value}
                      displayIcon={dropdownValueIcon && selectedTargetOption?.icon}
                      style={dropdownValueIcon
                        ? { "--icon-color": selectedTargetOption?.color } as unknown as CSSProperties
                        : {}
                      }
                      isOpen={isOpen}
                      placeholder={
                        targetOptions.length === 0
                          ? dependencies && dependencies.length > 0
                            ? `Nothing to map. Resolve ${dependencies.join(', ')} first.`
                            : "Nothing to map. Try choosing the Create or Skip action."
                          : "Select a target..."
                      }
                    >
                      <DropdownValueLabel>
                        {/*
                          Splitting by the option separator allows us to strip the extra text
                          shown next to the options in the dropdown (such as the already mapped source column).
                        */}
                        {selectedTargetOption?.label.split(TARGET_OPTION_MAPPING_SEPARATOR).at(0)}
                        <TargetType>
                          {formatDataType(selectedTargetOption?.type ?? "", selectedTargetOption?.isEnum)}
                        </TargetType>
                      </DropdownValueLabel>
                    </DropdownValueTemplate>
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
                value={
                  target
                  ? target as string
                  : source
                }
                disabled={!creating}
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
        </MappersTableTargetInner>
      </MappersTableTarget>
      {
        errorHandlingEnabled && (
          <MappersTableErrorHandling>
            {
              skipping
              ? (
                <InputText
                  value=""
                  disabled
                  placeholder="Will be skipped"
                />
              ) : (
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
              )
            }
          </MappersTableErrorHandling>
        )
      }
    </MappersTableBodyRow>
  )
}
