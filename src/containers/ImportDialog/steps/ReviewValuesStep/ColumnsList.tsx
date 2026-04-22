import { KeyboardEventHandler, useCallback, useEffect, useMemo, useRef } from "react";
import { ExtendedImportableColumn } from "../common";
import { ColumnMappingsEntry } from "./ReviewValuesStep";
import {
  ColumnsList,
  ColumnsListButton,
  ColumnsListItemStats,
  ColumnsListScrollable,
  ColumnsListWrapper,
  Heading,
} from "./ReviewValuesStep.styled";

type Props = {
  sortedMappingsToReview: ColumnMappingsEntry[]
  resolvedColumns: string[]
  activeTarget: string
  setActiveTarget: React.Dispatch<React.SetStateAction<string>>
  columnSettings: Record<string, ExtendedImportableColumn>
  uniqueValuesForColumn: Record<string, any[]>,
  unresolvedValues: Record<string, Set<any>>,
}

export default function ReviewValuesColumnsList({
  sortedMappingsToReview,
  resolvedColumns,
  activeTarget,
  setActiveTarget,
  columnSettings,
  uniqueValuesForColumn,
  unresolvedValues,
}: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null)

  const indexOfActiveTarget = useMemo(
    () => sortedMappingsToReview.findIndex(([_, { targetColumn }]) => activeTarget === targetColumn),
    [sortedMappingsToReview, activeTarget]
  )

  // keyboard navigation for listbox
  const onKeyUp: KeyboardEventHandler<HTMLDivElement> = useCallback((event) => {
    let index = indexOfActiveTarget

    switch (event.key) {
      case "ArrowUp":
        index = indexOfActiveTarget === 0
          ? sortedMappingsToReview.length - 1
          : indexOfActiveTarget - 1
        break
      case "ArrowDown":
        index = (indexOfActiveTarget + 1) % sortedMappingsToReview.length
        break
      case "Home":
        index = 0
        break
      case "End":
        index = sortedMappingsToReview.length - 1
        break
      default:
        break
    }

    const [, mapping] = sortedMappingsToReview[index]
    setActiveTarget(mapping.targetColumn)
  }, [indexOfActiveTarget])

  useEffect(() => {
    activeRef.current?.focus()
  }, [activeTarget])

  return (
    <ColumnsListWrapper
      onKeyUp={onKeyUp}
    >
      <Heading>Columns</Heading>
      <ColumnsListScrollable>
        <ColumnsList role="listbox">
          {
            sortedMappingsToReview
              .map(([column, { targetColumn }]) => (
              <li key={targetColumn}>
                <ColumnsListButton
                  variant="text"
                  role="option"
                  aria-selected={activeTarget === targetColumn}
                  ref={activeTarget === targetColumn ? activeRef : null}
                  tabIndex={activeTarget === targetColumn ? 0 : -1}
                  icon={resolvedColumns.includes(column) ? "check" : "error"}
                  iconProps={{
                    style: {
                      color: resolvedColumns.includes(column)
                        ? "var(--md-sys-color-tertiary)"
                        : "var(--md-sys-color-error)"
                    }
                  }}
                  selected={activeTarget === targetColumn}
                  onClick={() => setActiveTarget(targetColumn)}
                >
                  {
                    columnSettings[targetColumn].label
                  }
                  <ColumnsListItemStats>
                    {
                      uniqueValuesForColumn[column].length - unresolvedValues[column].size
                    } / {
                      uniqueValuesForColumn[column].length
                    }
                  </ColumnsListItemStats>
                </ColumnsListButton>
              </li>
            ))
          }
        </ColumnsList>
      </ColumnsListScrollable>
    </ColumnsListWrapper>
  )
}
