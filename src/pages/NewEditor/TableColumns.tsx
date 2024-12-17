import { useMemo } from "react"
import * as Styled from '@containers/Slicer/SlicerTable.styled'
import { $Any } from "@types"
import { ColumnDef, FilterFnOption, SortingFn, sortingFns } from "@tanstack/react-table"
import { compareItems } from "@tanstack/match-sorter-utils"
import clsx from "clsx"
import { Icon } from "@ynput/ayon-react-components"
import { TableRow } from "./useExtendedHierarchyTable"
import styled from "styled-components"

const DelayedShimmerWrapper = styled.div`
  @keyframes fadeInOpacity {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  opacity: 0;
  width: 100%;
  animation: fadeInOpacity 1s 1 forwards;
  animation-delay: 200ms;
`

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      // @ts-ignore
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      // @ts-ignore
      rowB.columnFiltersMeta[columnId]?.itemRank!,
    )
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

type Props = {
  tableData: $Any[]
  rootData: $Any[]
  attribs: $Any[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  toggleExpanderHandler: $Any
}

const ShimmerCell = ({ width }: { width: string }) => {
  return (
    <Styled.Cell style={{ width }}>
      <DelayedShimmerWrapper>
        <span
          className="loading shimmer-lightest"
          style={{ display: 'inline-block', width: '100%', height: '20px' }}
        />
      </DelayedShimmerWrapper>
    </Styled.Cell>
  )
}
const getColumns = ({
  tableData,
  rootData,
  attribs,
  isLoading,
  sliceId,
  toggleExpanderHandler,
}: Props) =>  {
  return useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        accessorKey: 'folderType',
        header: undefined,
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue }) => {
          return !row.original.id ? (
            <ShimmerCell width="300px" />
          ) : (
            <Styled.Cell
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              style={{
                //  add depth padding to the cell
                paddingLeft: `calc(${row.depth * 0.5}rem + 4px)`,
                width: '300px',
              }}
              tabIndex={0}
            >
              {row.original.data.type === 'folder' ? (
                <Styled.Expander
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpanderHandler(e, row.id)
                    row.getToggleExpandedHandler()()
                  }}
                  icon={row.getIsExpanded() ? 'expand_more' : 'chevron_right'}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <div style={{ display: 'inline-block', minWidth: 24 }} />
              )}
              {row.original.icon ? (
                <Icon icon={row.original.icon} style={{ color: row.original.iconColor }} />
              ) : (
                <span
                  className="loading shimmer-light"
                  style={{ minWidth: '20px', height: '20px' }}
                />
              )}
              {row.original.id ? (
                row.original.name && row.original.name
              ) : (
                <span
                  className="loading shimmer-light"
                  style={{ minWidth: '20px', height: '20px' }}
                />
              )}
              {row.original.startContent && row.original.startContent}
              <span className="title">{getValue<boolean>()}</span>
              <span className="title">{getValue<string>()}</span>
            </Styled.Cell>
          )
        },
      },
      {
        accessorKey: 'status',
        header: undefined,
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue }) => {
          return !row.original.id || rootData[row.original.id] === undefined ? (
            <ShimmerCell width="100px" />
          ) : (
            <Styled.Cell
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              style={{
                width: '100px',
              }}
              tabIndex={0}
            >
              { /* @ts-ignore */}
              {row.original.extended?.data?.status || 'none'}
            </Styled.Cell>
          )
        },
      },
      {
        accessorKey: 'assignees',
        header: undefined,
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue }) => {
          return !row.original.id || rootData[row.original.id] === undefined ? (
            <ShimmerCell width="100px" />
          ) : (
            <Styled.Cell
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              style={{
                width: '100px',
              }}
              tabIndex={0}
            >
              {/* @ts-ignore */}
              {rootData[row.id]?.data.attrib.priority}
            </Styled.Cell>
          )
        },
      },
      ...attribs.map((attrib: $Any) => {
        // console.log('attrib: ', attrib)
        return {
          accessorKey: attrib.name,
          header: undefined,
          filterFn: 'fuzzy' as FilterFnOption<TableRow>,
          sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
          cell: ({ row, getValue }: {row: $Any, getValue: $Any}) => {
          return !row.original.id || rootData[row.original.id] === undefined ? (
            <ShimmerCell width="100px" />
          ) : (
            <Styled.Cell
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              style={{
                width: '100px',
              }}
              tabIndex={0}
            >
              {rootData[row.id]?.data.attrib[attrib.name] || ''}
            </Styled.Cell>
          )
          },
        }
      }),
      {
        accessorKey: 'width',
        header: undefined,
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue }) => {
          return !row.original.id || rootData[row.original.id] === undefined ? (
            <ShimmerCell width="100px" />
          ) : (
            <Styled.Cell
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              style={{
                width: '100px',
              }}
              tabIndex={0}
            >
              { /* @ts-ignore */}
              {row.original.extended?.data?.attrib?.width || 'none'}
            </Styled.Cell>
          )
        },
      },
      {
        accessorKey: 'height',
        header: undefined,
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue }) => {
          return !row.original.id || rootData[row.original.id] === undefined ? (
            <ShimmerCell width="100px" />
          ) : (
            <Styled.Cell
              className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
              // onClick={(evt) => handleRowSelect(evt, row)}
              // onKeyDown={(evt) => handleRowKeyDown(evt, row)}
              style={{
                width: '100px',
              }}
              tabIndex={0}
            >
              { /* @ts-ignore */}
              {row.original.extended?.data?.attrib?.resolutionHeight || 'none'}
            </Styled.Cell>
          )
        },
      },
    ],
    [isLoading, sliceId, tableData],
  )

}
export { getColumns }