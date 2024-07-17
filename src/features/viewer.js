import { createSlice } from '@reduxjs/toolkit'
import getInitialStateQueryParam from './middleware/getInitialStateQueryParam'

export const initialStateQueryParams = {
  projectName: { key: 'project_name', initial: null },
  productId: { key: 'viewer_product', initial: null },
  selectedProductId: { key: 'selected_product', initial: null }, // used when there are reviewables from multiple products
  taskId: { key: 'viewer_task', initial: null },
  folderId: { key: 'viewer_folder', initial: null },
  versionIds: { key: 'viewer_version', initial: [] },
  reviewableIds: { key: 'reviewable_id', initial: [] },
}
const initialStateFromQueryParams = Object.entries(initialStateQueryParams).reduce(
  (acc, [key, value]) => {
    acc[key] = getInitialStateQueryParam(value.key, value.initial)
    return acc
  },
  {},
)

const viewerSlice = createSlice({
  name: 'viewer',
  initialState: {
    ...initialStateFromQueryParams,
    isOpen: false,
    upload: false, // used to open upload file picker
    fullscreen: false,
    quickView: false, // used to open quick view mode (reduced UI for quick view)
  },
  reducers: {
    openViewer: (
      state,
      {
        payload: {
          versionIds,
          projectName,
          productId,
          taskId,
          folderId,
          reviewableIds,
          quickView,
          selectedProductId,
        } = {},
      } = {},
    ) => {
      state.projectName = projectName
      state.quickView = !!quickView

      if (productId) state.productId = productId
      if (selectedProductId) state.selectedProductId = selectedProductId
      if (taskId) state.taskId = taskId
      if (folderId) state.folderId = folderId

      if (productId || taskId || folderId) state.isOpen = true

      if (versionIds) state.versionIds = versionIds
      if (reviewableIds) state.reviewableIds = reviewableIds || []
    },
    updateProduct: (state, { payload: { selectedProductId } }) => {
      state.selectedProductId = selectedProductId
    },
    updateSelection: (state, { payload: { versionIds, reviewableIds, productId, quickView } }) => {
      if (productId !== undefined) state.productId = productId
      if (versionIds !== undefined) {
        state.versionIds = versionIds
      }
      if (reviewableIds !== undefined) {
        state.reviewableIds = reviewableIds
      }
      if (quickView !== undefined) {
        state.quickView = quickView
      }
    },
    closeViewer: (state) => {
      state.versionIds = []
      state.projectName = null
      state.productId = null
      state.taskId = null
      state.folderId = null
      state.reviewableIds = []
      state.isOpen = false
      state.selectedProductId = null
    },
    toggleUpload: (state, { payload }) => {
      state.upload = payload
    },
    toggleFullscreen: (state, { payload }) => {
      state.fullscreen = payload ? payload.fullscreen : !state.fullscreen
    },
  },
})

export const {
  openViewer,
  updateProduct,
  updateSelection,
  closeViewer,
  toggleUpload,
  toggleFullscreen,
} = viewerSlice.actions
export default viewerSlice.reducer

// create an object for each reducer to define which state fields it will update
const viewerReducerSearchParams = {
  openViewer: [
    'productId',
    'selectedProductId',
    'taskId',
    'folderId',
    'versionIds',
    'projectName',
    'reviewableIds',
  ],
  updateProduct: ['selectedProductId'],
  updateSelection: ['versionIds', 'reviewableIds'],
  closeViewer: [
    { state: 'versionIds', value: [] },
    { state: 'projectName', value: null },
    { state: 'productId', value: null },
    { state: 'taskId', value: null },
    { state: 'folderId', value: null },
    { state: 'reviewableIds', value: [] },
    { state: 'selectedProductId', value: null },
  ],
}

// attach the keys for each state
// updateSelection: [{state: 'versionIds', key: 'version_id', value=[]}, {state: 'reviewableIds', key:'reviewable_id'}],

export const viewerSearchParams = Object.fromEntries(
  Object.entries(viewerReducerSearchParams).map(([key, value]) => {
    return [
      'viewer/' + key,
      value.map((item) => {
        // convert string items to objects
        let itemObject = typeof item === 'string' ? { state: item } : item

        return {
          ...itemObject,
          key: initialStateQueryParams[itemObject.state].key,
          initial: initialStateQueryParams[itemObject.state].initial,
        }
      }),
    ]
  }),
)
