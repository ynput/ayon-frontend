import { useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import { useLazyGetListItemsQuery, useUpdateEntityListItemsMutation } from '@shared/api'
import { parseCellId } from '@shared/containers/ProjectTreeTable'
import type { OperationWithRowId } from '@shared/containers/ProjectTreeTable'
import type { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import type { ColumnMenuItemType } from '@shared/components/ColumnHeaderMenuUI'
import { confirmDelete, getRequestErrorString } from '@shared/util'
import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import { useListValuesContext } from '../context/list-values'
import { toListValuesItem } from '../listValues/listItemValueSources'
import { isEntityAttribReadOnly } from '../util/getColumnConfigFromType'
import type { ListValueActionsHost, ListValuesItem } from '../listValues/types'
import type { ListItemsMap } from '../context/list-items-data/ListItemsDataContext'

type Props = {
  projectName: string
  listId?: string
  entityType?: string // the list's
  listItemsMap: ListItemsMap
  canEditList: boolean
}

const PAGE_SIZE = 1000

const readableError = (error: unknown) =>
  new Error(getRequestErrorString(error) || 'The request failed')

// The Lists page's side of the ListValues module's cell and column actions: requests, toasts
// and the confirm dialog. Which actions there are and what they do is the module's.
const useListValueActions = ({
  projectName,
  listId,
  entityType,
  listItemsMap,
  canEditList,
}: Props) => {
  const { module, rules } = useListValuesContext()
  const [updateEntityListItems] = useUpdateEntityListItemsMutation()
  const [getListItems] = useLazyGetListItemsQuery()
  const { updateEntities } = useTableQueriesHelper({ projectName })

  const host = useMemo<ListValueActionsHost | undefined>(() => {
    if (!listId || !canEditList) return undefined
    return {
      listId,
      context: rules,
      canEditEntities: !isEntityAttribReadOnly(entityType),
      getItem: (rowId) => {
        const item = listItemsMap.get(rowId)
        return item && toListValuesItem(item)
      },
      loadAllItems: async () => {
        const items: ListValuesItem[] = []
        let after: string | undefined
        do {
          const page = await getListItems({ projectName, listId, first: PAGE_SIZE, after })
            .unwrap()
            .catch((error) => Promise.reject(readableError(error)))
          for (const item of page.items) {
            const valuesItem = toListValuesItem(item)
            if (valuesItem) items.push(valuesItem)
          }
          after = (page.pageInfo.hasNextPage && page.pageInfo.endCursor) || undefined
        } while (after)
        return items
      },
      patchListItems: async (items) => {
        await updateEntityListItems({
          projectName,
          listId,
          entityListMultiPatchModel: { mode: 'merge', items },
        })
          .unwrap()
          .catch((error) => Promise.reject(readableError(error)))
      },
      updateEntities: async (items) => {
        const operations: OperationWithRowId[] = items.map((item) => ({
          type: 'update',
          entityType: item.entityType as OperationWithRowId['entityType'],
          entityId: item.entityId,
          rowId: item.rowId,
          data: { attrib: item.attrib, ownAttrib: item.ownAttrib },
        }))
        await updateEntities({ operations }).catch((error) => Promise.reject(readableError(error)))
      },
      notify: {
        loading: (message) => toast.loading(message),
        done: (id, message, type) =>
          toast.update(id, {
            render: message,
            type,
            isLoading: false,
            autoClose: type === 'error' ? 5000 : 3000,
          }),
        error: (message) => toast.error(message),
      },
      confirm: ({ header, message, acceptLabel }) =>
        new Promise<boolean>((resolve) =>
          confirmDelete({
            header,
            message,
            deleteLabel: acceptLabel,
            showToasts: false,
            accept: async () => resolve(true),
            reject: () => resolve(false),
            onHide: () => resolve(false),
          }),
        ),
    }
  }, [
    listId,
    entityType,
    canEditList,
    rules,
    listItemsMap,
    getListItems,
    projectName,
    updateEntityListItems,
    updateEntities,
  ])

  const listValueMenuItem: ContextMenuItemConstructor = (_e, _cell, selectedCells) => {
    if (!host) return undefined
    const cells = selectedCells.flatMap((cell) => {
      const rowId = parseCellId(cell.cellId)?.rowId
      if (!rowId || !cell.columnId.startsWith('attrib_')) return []
      return [{ rowId, attrib: cell.columnId.replace('attrib_', '') }]
    })
    return cells.length ? module.getCellMenuItems(cells, host) : undefined
  }

  const getColumnMenuItems = useCallback(
    (attrib: string): ColumnMenuItemType[] =>
      host
        ? module.getColumnMenuItems(attrib, host).map((item) => ({
            id: `list-value-${item.label}`,
            label: item.label,
            icon: item.icon,
            onClick: item.command,
          }))
        : [],
    [host, module],
  )

  return { listValueMenuItem, getColumnMenuItems }
}

export default useListValueActions
