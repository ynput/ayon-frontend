import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { InputText, TablePanel, Section, Toolbar, Spacer } from '@ynput/ayon-react-components'
import EntityDetail from '/src/containers/entityDetail'
import { CellWithIcon } from '/src/components/icons'
import { TimestampField } from '/src/containers/fieldFormat'
import usePubSub from '/src/hooks/usePubSub'

import groupResult from '/src/helpers/groupResult'
import useLocalStorage from '/src/hooks/useLocalStorage'
import {
  setFocusedVersions,
  setFocusedProducts,
  setSelectedVersions,
  setUri,
  setPairing,
  productSelected,
  onFocusChanged,
} from '/src/features/context'
import VersionList from './VersionList'
import StatusSelect from '/src/components/status/statusSelect'

import { useGetProductListQuery } from '/src/services/getProductList'
import { MultiSelect } from 'primereact/multiselect'
import useSearchFilter from '/src/hooks/useSearchFilter'
import useColumnResize from '/src/hooks/useColumnResize'
import { useUpdateEntitiesDetailsMutation } from '/src/services/entity/updateEntity'
import { ayonApi } from '/src/services/ayon'
import useCreateContext from '/src/hooks/useCreateContext'
import ViewModeToggle from './ViewModeToggle'
import ProductsList from './ProductsList'
import ProductsGrid from './ProductsGrid'
import NoProducts from './NoProducts'

const Products = () => {
  const dispatch = useDispatch()

  // context
  const productTypes = useSelector((state) => state.project.productTypes)

  const projectName = useSelector((state) => state.project.name)
  const focusedVersions = useSelector((state) => state.context.focused.versions)
  const focusedFolders = useSelector((state) => state.context.focused.folders)
  const statusesObject = useSelector((state) => state.project.statuses)
  const selectedVersions = useSelector((state) => state.context.selectedVersions)
  const focusedProducts = useSelector((state) => state.context.focused.products)
  const pairing = useSelector((state) => state.context.pairing)
  const lastFocused = useSelector((state) => state.context.focused.lastFocused)

  const [focusOnReload, setFocusOnReload] = useState(null) // version id to refocus to after reload
  const [showDetail, setShowDetail] = useState(false) // false or 'product' or 'version'
  // grid/list/grouped
  const [viewMode, setViewMode] = useLocalStorage('productsViewMode', 'list')
  const [grouped, setGrouped] = useState(false)

  // sets size of status based on status column width
  const [columnsWidths, setColumnWidths] = useColumnResize('products')

  // version overrides
  // Get a list of version overrides for the current set of folders
  let versionOverrides = []
  for (const folderId of focusedFolders) {
    const c = selectedVersions[folderId]
    if (!c) continue
    for (const productId in c) {
      const versionId = c[productId]
      if (versionOverrides.includes(versionId)) continue
      versionOverrides.push(versionId)
    }
  }
  if (versionOverrides.length === 0) {
    // We need at least one item in the array to filter.
    versionOverrides = ['00000000000000000000000000000000']
  }

  const {
    data: productData = [],
    isLoading,
    isSuccess,
    refetch,
    isFetching,
  } = useGetProductListQuery(
    {
      ids: focusedFolders,
      projectName,
      versionOverrides,
    },
    { skip: !projectName },
  )

  // refocus version product after reload
  useEffect(() => {
    if (focusOnReload && isSuccess) {
      dispatch(setFocusedVersions([focusOnReload]))
      setFocusOnReload(null)
    }
  }, [focusOnReload, isSuccess])

  // PUBSUB HOOK
  usePubSub(
    'entity.product',
    refetch,
    productData.map(({ id }) => id),
  )

  const [updateEntity] = useUpdateEntitiesDetailsMutation()

  // update product status
  const handleStatusChange = async (value, selectedId) => {
    try {
      // get selected product ids based on focused selection
      let productIds = focusedProducts.includes(selectedId) ? focusedProducts : [selectedId]
      const products = productData.filter(({ id }) => productIds.includes(id))
      // get version ids from selected products
      const ids = products.map(({ versionId }) => versionId)

      // update version status

      const payload = await updateEntity({
        projectName,
        type: 'version',
        ids: ids,
        data: { ['status']: value },
      }).unwrap()

      // create new patch data of products
      const patchData = productData.map(({ versionId, versionStatus, ...product }) => ({
        ...product,
        versionStatus: ids.includes(versionId) ? value : versionStatus,
        versionId,
      }))

      console.log(patchData)

      // update products cache
      dispatch(
        ayonApi.util.updateQueryData(
          'getProductList',
          { projectName, ids: focusedFolders, versionOverrides },
          (draft) => {
            Object.assign(draft, patchData)
          },
        ),
      )

      console.log('fulfilled', payload)
    } catch (error) {
      console.error('rejected', error)
    }
  }

  const handleStatusOpen = (id) => {
    // handles the edge case where the use foccusess multiple products but then changes a different status
    if (!focusedProducts.includes(id)) {
      // not in focused selection
      // reset selection to status id
      dispatch(setFocusedProducts([id]))
    }
  }

  let columns = [
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

        return <CellWithIcon icon={icon} iconClassName={className} text={node.data.name} />
      },
    },
    {
      field: 'versionStatus',
      header: 'Status',
      width: 150,
      style: { overflow: 'visible' },
      body: (node) => {
        if (node.data.isGroup) return ''
        const statusMaxWidth = 120
        return (
          <StatusSelect
            value={node.data.versionStatus}
            size={
              columnsWidths['status'] < statusMaxWidth
                ? columnsWidths['status'] < 60
                  ? 'icon'
                  : 'short'
                : 'full'
            }
            onChange={(v) => handleStatusChange(v, node.data.id)}
            multipleSelected={focusedProducts.length}
            onOpen={() => handleStatusOpen(node.data.id)}
            style={{ maxWidth: '100%' }}
          />
        )
      },
    },
    {
      field: 'folder',
      header: 'Folder',
      width: 200,
    },
    {
      field: 'productType',
      header: 'Product type',
      width: 120,
    },
    {
      field: 'versionList',
      header: 'Version',
      width: 70,
      body: (node) =>
        VersionList(node.data, (productId, versionId) => {
          // TODO changing version doesn't auto update version detail
          let newSelection = { ...selectedVersions[node.data.folderId] }
          newSelection[productId] = versionId
          dispatch(
            setSelectedVersions({
              ...selectedVersions,
              [node.data.folderId]: newSelection,
            }),
          )
          setFocusOnReload(versionId)
        }), // end VersionList
    },
    {
      field: 'createdAt',
      header: 'Created At',
      width: 150,
      body: (node) => node.data.createdAt && <TimestampField value={node.data.createdAt} />,
    },
    {
      field: 'author',
      header: 'Author',
      width: 120,
    },
    {
      field: 'frames',
      header: 'Frames',
      width: 120,
    },
  ]

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

  const handleColumnsFilter = (e) => {
    e.preventDefault()
    const newArray = e.target.value || []

    if (newArray.length) {
      // make sure there's always at least one column
      isMultiSelected
        ? setShownColumnsMultiFocused(newArray)
        : setShownColumnsSingleFocused(newArray)
    }
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

  // only filter columns if required
  if (shownColumns.length < columns.length) {
    columns = columns.filter(({ field }) => shownColumns.includes(field))
  }

  //
  // Hooks
  //

  // Parse focusedVersions list from the project context
  // and create a list of selected product rows compatible
  // with the TreeTable component

  const selectedRows = useMemo(() => {
    if (focusedVersions?.length === 0) return {}
    const productIds = {}
    for (const sdata of productData) {
      if (focusedVersions.includes(sdata.versionId)) {
        productIds[sdata.id] = true
      }
    }
    return productIds
  }, [productData, focusedVersions])

  // Since using dispatch in useMemo causes errors,
  // we need to use useEffect to update task-version pairing
  // in the context

  useEffect(() => {
    if (!focusedVersions.length) return
    const pairs = []
    for (const sdata of productData) {
      if (focusedVersions.includes(sdata.versionId)) {
        if (sdata.taskId) {
          pairs.push({
            taskId: sdata.taskId,
            folderId: sdata.folderId,
            versionId: sdata.versionId,
          })
        }
      }
    }
    dispatch(setPairing(pairs))
    // shut up about missing dispatch dependency
    // eslint-disable-next-line
  }, [productData, focusedVersions])

  // Transform the product data into a TreeTable compatible format
  // by grouping the data by the product name

  let tableData = useMemo(() => {
    return groupResult(productData, 'name')
  }, [productData])

  const searchableFields = [
    'data.author',
    'data.productType',
    'data.folder',
    'data.fps',
    'data.frames',
    'data.name',
    'data.resolution',
    'data.status',
    'data.versionName',
  ]

  let [search, setSearch, filteredData] = useSearchFilter(searchableFields, tableData, 'products')

  //
  // Handlers
  //

  const handleGridContext = () => {
    // set selection and open context menu
  }

  // Set the breadcrumbs when a row is clicked
  const onRowClick = (event) => {
    if (event.node.data.isGroup) {
      return
    }

    let uri = `ayon+entity://${projectName}/`
    uri += `${event.node.data.parents.join('/')}/${event.node.data.folder}`
    uri += `?product=${event.node.data.name}`
    uri += `&version=${event.node.data.versionName}`
    dispatch(setUri(uri))
    dispatch(onFocusChanged(event.node.data.id))
  }

  const onSelectionChange = (event) => {
    let versions = []
    let products = []
    const selection = Object.keys(event.value)
    for (const sdata of productData) {
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

  const onContextMenuSelectionChange = (event) => {
    if (focusedProducts.includes(event.value)) return
    const productId = event.value
    const versionId = productData.find((s) => s.id === productId).versionId
    dispatch(setFocusedProducts([productId]))
    dispatch(setFocusedVersions([versionId]))
  }

  const ctxMenuItems = [
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

  const [ctxMenuShow] = useCreateContext(ctxMenuItems)

  //
  // Render
  //
  const getOutOfString = (value, total) => {
    if (value.length === total.length) return ''

    return `${value.length}/${total.length}`
  }

  const placeholder = `Show Columns  ${
    isMultiSelected
      ? `${getOutOfString(shownColumnsMultiFocused, filterOptions)} (Multiple)`
      : `${getOutOfString(shownColumnsSingleFocused, filterOptions)} (Single)`
  }`

  const isNone = filteredData.length === 0

  return (
    <Section className="wrap">
      <Toolbar>
        <InputText
          style={{ width: '200px' }}
          placeholder="Filter products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autocomplete="off"
        />
        <MultiSelect
          options={filterOptions}
          value={shownColumns}
          onChange={handleColumnsFilter}
          placeholder={placeholder}
          fixedPlaceholder
        />
        <Spacer />
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          grouped={grouped || focusedFolders.length > 1}
          setGrouped={setGrouped}
        />
      </Toolbar>
      <TablePanel style={{ overflow: 'hidden' }}>
        <EntityDetail
          projectName={projectName}
          entityType={showDetail || 'product'}
          entityIds={showDetail === 'product' ? focusedProducts : focusedVersions}
          visible={!!showDetail}
          onHide={() => setShowDetail(false)}
          versionOverrides={versionOverrides}
          onContext={handleGridContext}
        />
        {viewMode !== 'list' && (
          <ProductsGrid
            isLoading={isLoading || isFetching}
            data={filteredData}
            onItemClick={onRowClick}
            onSelectionChange={onSelectionChange}
            onContext={ctxMenuShow}
            onContextMenuSelectionChange={onContextMenuSelectionChange}
            selection={selectedRows}
            productTypes={productTypes}
            statuses={statusesObject}
            lastSelected={lastFocused}
            groupBy={grouped || focusedFolders.length > 1 ? 'productType' : null}
            multipleFoldersSelected={focusedFolders.length > 1}
          />
        )}
        {viewMode === 'list' && (
          <ProductsList
            data={filteredData}
            selectedRows={selectedRows}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            ctxMenuShow={ctxMenuShow}
            onContextMenuSelectionChange={onContextMenuSelectionChange}
            setColumnWidths={setColumnWidths}
            columns={columns}
            columnsWidths={columnsWidths}
            isLoading={isLoading || isFetching}
          />
        )}
        {isNone && !isLoading && !isFetching && <NoProducts />}
      </TablePanel>
    </Section>
  )
}

export default Products
