import { useState, useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { InputText, TablePanel, Section, Toolbar, Spacer } from '@ynput/ayon-react-components'
import { CellWithIcon } from '@components/icons'
import { TimestampField } from '@containers/fieldFormat'
import usePubSub from '@hooks/usePubSub'
// shared
import { DetailsDialog } from '@shared/components'
import { useLocalStorage, useScopedStatuses } from '@shared/hooks'
import api, { useUpdateEntitiesMutation } from '@shared/api'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { productTypes, groupResult } from '@shared/util'
import { extractIdFromClassList } from '@shared/containers/Feed'

import {
  setFocusedVersions,
  setFocusedProducts,
  setSelectedVersions,
  setUri,
  productSelected,
  onFocusChanged,
  updateBrowserFilters,
} from '@state/context'
import VersionList from './VersionList'
import StatusSelect from '@components/status/statusSelect'
import {
  useGetProductListQuery,
  useLazyGetProductsVersionsQuery,
} from '@queries/product/getProduct'
import usePatchProductsListWithVersions from '@hooks/usePatchProductsListWithVersions'
import useSearchFilter, { filterByFieldsAndValues } from '@hooks/useSearchFilter'
import useColumnResize from '@hooks/useColumnResize'
import ViewModeToggle from './ViewModeToggle'
import ProductsList from './ProductsList'
import ProductsGrid from './ProductsGrid'
import NoProducts from './NoProducts'
import { toast } from 'react-toastify'
import * as Styled from './Products.styled'
import { openViewer } from '@state/viewer'
import { useEntityListsContext } from '@pages/ProjectListsPage/context/EntityListsContext'

const Products = () => {
  const dispatch = useDispatch()

  // context
  // project redux
  const {
    name: projectName,
    statuses: statusesObject,
    tasksOrder = [],
    tasks = {},
  } = useSelector((state) => state.project)
  // focused redux
  const {
    versions: focusedVersions,
    folders: focusedFolders,
    products: focusedProducts,
    lastFocused,
  } = useSelector((state) => state.context.focused)
  // context redux
  const selectedVersions = useSelector((state) => state.context.selectedVersions)
  const pairing = useSelector((state) => state.context.pairing)
  const versionStatusesList = useScopedStatuses([projectName], ['version'])

  const selectedTaskTypes = useSelector((state) => state.context.filters.browser.productTaskTypes)
  // create an array of options for the tasks dropdown using tasksOrder and tasks
  const taskOptions = useMemo(() => {
    return tasksOrder.map((taskId) => {
      const task = tasks[taskId]
      return {
        label: task.name,
        value: taskId,
        icon: task.icon,
      }
    })
  }, [tasks, tasksOrder])

  const handleTaskTypeChange = (value) => {
    dispatch(updateBrowserFilters({ productTaskTypes: value }))
  }

  const [showDetail, setShowDetail] = useState(false) // false or 'product' or 'version'
  // grid/list/grouped
  const [viewMode, setViewMode] = useLocalStorage('productsViewMode', 'list')
  const [grouped, setGrouped] = useState(false)

  // sets size of status based on status column width
  const [columnsWidths, setColumnWidths] = useColumnResize('products')

  const {
    data: productsData = [],
    isLoading,
    refetch,
    isFetching,
    error,
  } = useGetProductListQuery(
    {
      folderIds: focusedFolders,
      projectName,
    },
    { skip: !projectName },
  )

  // keep track of which products are loading (mainly used for versions loading)
  const [loadingProducts, setLoadingProducts] = useState([])

  // lazy query to fetch versions, the cache is based on versionIds provided
  const [getProductsVersions] = useLazyGetProductsVersionsQuery()

  const getListData = (productsData) => {
    let selectionId
    let selectedVersionId
    for (const key in selectedVersions) {
      if (selectedVersions[key].folderId == focusedFolders[0]) {
        selectionId = key
        selectedVersionId = selectedVersions[key].versionId
        break
      }
    }

    if (!focusedFolders[0]) {
      return productsData
    }

    return productsData.map((el) => {
      if (el.id !== selectionId) {
        return el
      }

      const versionName = el.versionList.filter((el) => el.id == selectedVersionId)[0]?.name
      if (!versionName) {
        return el
      }

      return {
        ...el,
        versionId: selectedVersionId,
        versionName,
      }
    })
  }

  const listData = getListData(productsData)

  const patchProductsListWithVersions = usePatchProductsListWithVersions({ projectName })

  // get new versions data and patch into cache and update versions local state
  const handleVersionChange = async (productVersionPairs = [[]]) => {
    // productVersionPairs is an array of arrays

    const productIds = [],
      versionIds = []
    for (const [vId, pId] of productVersionPairs) {
      productIds.push(pId)
      versionIds.push(vId)
    }

    setLoadingProducts(productIds)

    try {
      const versions = await getProductsVersions({ ids: versionIds, projectName }, true).unwrap()

      patchProductsListWithVersions(versions)

      setLoadingProducts([])
      // return so that the focus can update
      return versions
    } catch (error) {
      console.error('Error while loading versions:', error)
      toast.error('Error while loading versions')
      setLoadingProducts([])
      return []
    }
  }

  // PUBSUB HOOK
  usePubSub(
    'entity.product',
    refetch,
    listData.map(({ id }) => id),
  )

  const [updateEntities] = useUpdateEntitiesMutation()

  const handleUpdate = async (field, value, ids = []) => {
    if (value === null || value === undefined) return console.error('value is null or undefined')

    try {
      // build entities operations array
      const operations = ids.map((id) => ({
        id: id,
        projectName: projectName,
        data: {
          [field]: value,
        },
      }))

      return await updateEntities({ operations, entityType: 'version' })
    } catch (error) {
      toast.error('Error updating' + 'version ')
    }
  }

  // update product status
  const handleStatusChange = async (value, selectedId) => {
    // get selected product ids based on focused selection
    let productIds = focusedProducts.includes(selectedId) ? focusedProducts : [selectedId]
    const products = listData.filter(({ id }) => productIds.includes(id))
    // get version ids from selected products
    const ids = products.map(({ versionId }) => versionId)

    const versions = products.map((product) => ({
      productId: product.id,
      versionId: product.versionId,
      versionStatus: value,
    }))

    // update productsList cache with new status
    patchProductsListWithVersions(versions)

    try {
      await handleUpdate('status', value, ids)

      // invalidate 'version' query (specific version query)
      // we do this so that when we select this version again, it doesn't use stale version query
      dispatch(api.util.invalidateTags(ids.map((id) => ({ type: 'version', id }))))

      // invalidate 'detail' query (details panel)
      // dispatch(api.util.invalidateTags(ids.map((id) => ({ type: 'detail', id }))))
    } catch (error) {
      console.error(error)

      toast.error(error?.message || 'Failed to update')
      // we also need to undo the patch
    }
  }

  const handleStatusOpen = (productId, versionId) => {
    // handles the edge case where the use foccusess multiple products but then changes a different status
    if (!focusedProducts.includes(productId)) {
      // not in focused selection
      dispatch(productSelected({ products: [productId], versions: [versionId] }))
    }
  }

  const onSelectVersion = async (
    { versionId, productId, folderId, versionName, currentSelected },
    data,
  ) => {
    // load data here and patch into cache
    const res = await handleVersionChange([[versionId, productId]])
    if (res) {
      // copy current selection
      let newSelection = { ...currentSelected }
      // update selection
      newSelection[productId] = { versionId, folderId }

      dispatch(setSelectedVersions(newSelection))
      // set selected product
      dispatch(productSelected({ products: [productId], versions: [versionId] }))
      // update breadcrumbs
      let uri = `ayon+entity://${projectName}/`
      uri += `${data.parents.join('/')}/${data.folder}`
      uri += `?product=${data.name}`
      uri += `&version=${versionName}`
      dispatch(setUri(uri))
    }
  }

  let columns = useMemo(
    () => [
      {
        field: 'name',
        header: 'Product',
        width: 200,
        body: (node) => {
          let className = ''
          let i = 0
          for (const pair of pairing) {
            i++
            if (pair.taskId === node.data.taskId) {
              className = `row-hl-${i}`
              break
            }
          }

          const icon = node.data.isGroup
            ? 'folder'
            : productTypes[node.data.productType]?.icon || 'inventory_2'

          return (
            <CellWithIcon
              icon={icon}
              iconClassName={className}
              text={node.data.label}
              name={node.data.name}
            />
          )
        },
      },
      {
        field: 'versionStatus',
        header: 'Version Status',
        width: 180,
        style: { height: 'max-content' },
        body: (node) => {
          if (node.data.isGroup) return ''
          const statusMaxWidth = 120
          const versionStatusWidth = columnsWidths['versionStatus']
          const resolveWidth = (statusWidth) => {
            if (statusWidth < 60) return 'icon'
            if (statusWidth < statusMaxWidth) return 'short'
            return 'full'
          }

          return (
            <StatusSelect
              options={versionStatusesList}
              value={node.data.versionStatus}
              size={resolveWidth(versionStatusWidth)}
              onChange={(v) => handleStatusChange(v, node.data.id)}
              multipleSelected={focusedProducts.length}
              onOpen={() => handleStatusOpen(node.data.id, node.data.versionId)}
              style={{ maxWidth: '100%' }}
            />
          )
        },
      },
      {
        field: 'productType',
        header: 'Product type',
        width: 120,
      },
      {
        field: 'taskName',
        header: 'Task',
        width: 120,
      },
      {
        field: 'folder',
        header: 'Folder',
        width: 120,
      },
      {
        field: 'versionList',
        header: 'Version',
        width: 70,
        body: (node) => (
          <VersionList
            row={node.data}
            selectedVersions={selectedVersions}
            onSelectVersion={(version) => onSelectVersion(version, node.data)}
          />
        ),
      },
      {
        field: 'createdAt',
        header: 'Created At',
        width: 150,
        body: (node) => node.data.createdAt && <TimestampField value={node.data.createdAt} />,
      },
      {
        field: 'versionAuthor',
        header: 'Author',
        width: 120,
      },
      {
        field: 'frames',
        header: 'Frames',
        width: 120,
      },
    ],
    [
      columnsWidths,
      focusedProducts,
      pairing,
      productTypes,
      selectedVersions,
      handleStatusChange,
      handleStatusOpen,
      listData,
    ],
  )

  const filterOptions = columns.map(({ field, header }) => ({
    value: field,
    label: header || field,
  }))
  const allColumnsNames = filterOptions.map(({ value }) => value)
  const isMultiSelected = focusedFolders.length > 1

  const [shownColumnsSingleFocused, setShownColumnsSingleFocused] = useLocalStorage(
    'products-columns-filter-single',
    allColumnsNames,
  )
  const [shownColumnsMultiFocused, setShownColumnsMultiFocused] = useLocalStorage(
    'products-columns-filter-multi',
    allColumnsNames,
  )

  const handleColumnsFilter = (value = []) => {
    // if multiple folders are selected, we need to save the columns in a different local storage
    isMultiSelected ? setShownColumnsMultiFocused(value) : setShownColumnsSingleFocused(value)
  }

  // sort columns if localstorage set
  let columnsOrder = localStorage.getItem('products-columns-order')
  if (columnsOrder) {
    try {
      columnsOrder = JSON.parse(columnsOrder)
      columns.sort((a, b) => columnsOrder[a.field] - columnsOrder[b.field])
    } catch (error) {
      console.log(error)
      // remove local stage
      localStorage.removeItem('products-columns-order')
    }
  }

  const shownColumns = isMultiSelected ? shownColumnsMultiFocused : shownColumnsSingleFocused

  // only filter if above zero otherwise show all columns
  if (shownColumns.length) {
    columns = columns.filter(({ field }) => shownColumns.includes(field))
  }

  //
  // Hooks
  //

  // Parse focusedVersions list from the project context
  // and create a list of selected product rows compatible
  // with the TreeTable component

  const selection = useMemo(() => {
    if (focusedVersions?.length === 0) return {}
    const productIds = {}
    for (const sdata of listData) {
      if (focusedVersions.includes(sdata.versionId)) {
        productIds[sdata.id] = true
      }
    }
    return productIds
  }, [listData, focusedVersions])

  // Transform the product data into a TreeTable compatible format
  // by grouping the data by the product name

  // filter by task types
  const filteredByFieldsData = selectedTaskTypes.length
    ? filterByFieldsAndValues({
        filters: selectedTaskTypes,
        data: listData,
        fields: ['taskType'],
      })
    : listData

  const searchableFields = [
    'versionAuthor',
    'productType',
    'folder',
    'fps',
    'frames',
    'name',
    'resolution',
    'versionStatus',
    'versionName',
    'taskType',
    'taskName',
  ]

  let [search, setSearch, filteredBySearchData] = useSearchFilter(
    searchableFields,
    filteredByFieldsData,
    'products',
  )

  const tableData = useMemo(() => {
    return groupResult(filteredBySearchData, 'name')
  }, [filteredBySearchData])

  //
  // Handlers
  //

  // create empty context menu model
  // we will populate it later
  const [showTableContextMenu] = useCreateContextMenu([])

  // context menu model for hiding columns
  const createTableHeaderModel = useCallback(
    (name) => {
      const oldArray = isMultiSelected ? shownColumnsMultiFocused : shownColumnsSingleFocused
      const newArray = oldArray.filter((item) => item !== name)
      const disabled = newArray.length === 0
      const command = () =>
        isMultiSelected
          ? setShownColumnsMultiFocused(newArray)
          : setShownColumnsSingleFocused(newArray)

      return [
        {
          label: 'Hide column',
          icon: 'visibility_off',
          disabled,
          command,
        },
      ]
    },
    [
      isMultiSelected,
      shownColumnsMultiFocused,
      shownColumnsSingleFocused,
      setShownColumnsMultiFocused,
      setShownColumnsSingleFocused,
    ],
  )

  const handleTablePanelContext = (e) => {
    // find the th that was clicked
    const th = e.target.closest('th')

    // return is no th was found
    if (!th) return

    // get the first class of the th (field name)
    const field = th.classList[0]
    if (field) {
      // show context menu
      showTableContextMenu(e, createTableHeaderModel(field))
    }
  }

  const updateUri = (node) => {
    const isGroup = node.isGroup
    if (isGroup) return

    let uri = `ayon+entity://${projectName}/`
    uri += `${node.parents.join('/')}/${node.folder}`
    uri += `?product=${node.name}`
    uri += `&version=${node.versionName}`
    dispatch(setUri(uri))
    dispatch(onFocusChanged(node.id))
  }

  const onRowFocusChange = (event) => {
    const id = extractIdFromClassList(event.target.classList)
    if (!id) return
    const node = listData.find((s) => s.id === id)
    if (!node) return

    updateUri(node)
  }

  const onSelectionChange = (event) => {
    let versions = []
    let products = []
    const selection = Object.keys(event.value)
    for (const sdata of listData) {
      if (selection.includes(sdata.id)) {
        versions.push(sdata.versionId)
        products.push(sdata.id)
      }
    }
    // we need to set the focused versions first
    // otherwise setFocusedProducts will clear the selection
    // of versions.
    dispatch(productSelected({ products, versions }))
  }

  // viewer open
  const viewerIsOpen = useSelector((state) => state.viewer.isOpen)

  const handleOpenViewer = (productId, quickView) => {
    // find the version id of the product
    const product = listData.find((s) => s.id === productId) || {}
    if (!product) return toast.error('No product found')
    const { versionId, folderId } = product

    // check review isn't already open
    if (!viewerIsOpen) {
      dispatch(
        openViewer({
          folderId,
          selectedProductId: productId,
          versionIds: [versionId],
          projectName,
          quickView,
        }),
      )
    }
  }

  const {
    buildAddToListMenu,
    buildListMenuItem,
    newListMenuItem,
    versions: versionsLists,
    reviews: reviewsLists,
  } = useEntityListsContext()

  const ctxMenuItems = (id, selectedProducts, selectedVersions) => {
    const selectedEntities = selectedVersions.map((id) => ({ entityId: id, entityType: 'version' }))
    return [
      {
        label: 'Open in viewer',
        command: () => handleOpenViewer(id),
        icon: 'play_circle',
        shortcut: 'Spacebar',
      },
      buildAddToListMenu(
        [
          ...versionsLists.data.map((list) =>
            buildListMenuItem(list, selectedEntities, !!reviewsLists.data.length),
          ),
          ...reviewsLists.data.map((list) => buildListMenuItem(list, selectedEntities, true)),
          newListMenuItem('version', selectedEntities),
        ],
        { label: 'Add to list (version)' },
      ),
      {
        label: 'Product detail',
        command: () => setShowDetail('product'),
        icon: 'database',
      },
      {
        label: 'Version detail',
        command: () => setShowDetail('version'),
        icon: 'database',
      },
    ]
  }

  const [ctxMenuShow] = useCreateContextMenu([])

  const handleContextMenu = (e, id) => {
    // If the product isn't in the current selection, update selection to just this product
    let selectedProducts = [...focusedProducts],
      selectedVersions = [...focusedVersions]
    if (!selectedProducts.includes(id)) {
      const productId = id
      const versionId = listData.find((s) => s.id === productId).versionId
      dispatch(setFocusedProducts([productId]))
      dispatch(setFocusedVersions([versionId]))

      selectedProducts = [productId]
      selectedVersions = [versionId]
    }

    // Use the full selection (either the existing selection if id was part of it,
    // or just the single item that was just selected)
    ctxMenuShow(e, ctxMenuItems(id, selectedProducts, selectedVersions))
  }

  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      const firstSelected = Object.keys(selection)[0]
      if (firstSelected) {
        handleOpenViewer(firstSelected, true)
      }
    }
  }

  //
  // Render
  //

  const isNone = tableData.length === 0

  return (
    <Section wrap>
      <Toolbar>
        <InputText
          style={{ width: '200px' }}
          placeholder="Filter products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          data-tooltip="Use '!' to exclude and ',' to separate multiple filters. Example: '!image, render, compositing'"
        />
        <Styled.TaskFilterDropdown
          value={selectedTaskTypes}
          options={taskOptions}
          onChange={handleTaskTypeChange}
          onClear={!!selectedTaskTypes.length && handleTaskTypeChange}
          clearTooltip="Clear task types"
          placeholder="Task types..."
          multiSelect
        />
        <Styled.ColumnsFilterSelect
          options={filterOptions}
          value={shownColumns}
          onChange={handleColumnsFilter}
          onClear={!!shownColumns.length && handleColumnsFilter}
          multiSelect
        />
        <Spacer />
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          grouped={grouped || focusedFolders.length > 1}
          setGrouped={setGrouped}
          disabled={focusedFolders.length > 1 ? ['grid'] : []}
        />
      </Toolbar>
      <TablePanel
        style={{ overflow: 'hidden' }}
        onContextMenu={handleTablePanelContext}
        onKeyDown={handleKeyDown}
      >
        <DetailsDialog
          projectName={projectName}
          entityType={showDetail || 'product'}
          entityIds={showDetail === 'product' ? focusedProducts : focusedVersions}
          visible={!!showDetail}
          onHide={() => setShowDetail(false)}
        />
        {viewMode !== 'list' && (
          <ProductsGrid
            isLoading={isLoading || isFetching}
            data={tableData}
            onItemClick={updateUri}
            onSelectionChange={onSelectionChange}
            onContext={handleContextMenu}
            selection={selection}
            productTypes={productTypes}
            statuses={statusesObject}
            lastSelected={lastFocused}
            groupBy={grouped || focusedFolders.length > 1 ? 'productType' : null}
            multipleFoldersSelected={focusedFolders.length > 1}
            projectName={projectName}
          />
        )}
        {viewMode === 'list' && (
          <ProductsList
            treeData={tableData}
            selection={selection}
            onSelectionChange={onSelectionChange}
            onFocus={onRowFocusChange}
            ctxMenuShow={handleContextMenu}
            setColumnWidths={setColumnWidths}
            columns={columns}
            columnsWidths={columnsWidths}
            isLoading={isLoading || isFetching}
            loadingProducts={loadingProducts}
          />
        )}
        {isNone && !isLoading && !isFetching && <NoProducts error={error} />}
      </TablePanel>
    </Section>
  )
}

export default Products
