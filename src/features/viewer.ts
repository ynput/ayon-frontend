import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import getInitialStateQueryParam from './middleware/getInitialStateQueryParam'

export const initialStateQueryParams: Record<string, { key: string; initial: any }> = {
  projectName: { key: 'project_name', initial: null },
  productId: { key: 'viewer_product', initial: null },
  selectedProductId: { key: 'selected_product', initial: null }, // used when there are reviewables from multiple products
  taskId: { key: 'viewer_task', initial: null },
  folderId: { key: 'viewer_folder', initial: null },
  versionIds: { key: 'viewer_version', initial: [] },
  reviewableIds: { key: 'reviewable_id', initial: [] },
}

const initialStateFromQueryParams: ViewerState = Object.entries(initialStateQueryParams).reduce(
  (acc: Partial<ViewerState>, [key, value]) => {
    acc[key as keyof ViewerState] = getInitialStateQueryParam(value.key, value.initial)
    return acc
  },
  {} as Partial<ViewerState>,
) as ViewerState

export interface ViewerState {
  isOpen: boolean
  versionIds: string[]
  projectName: string | null
  productId: string | null
  taskId: string | null
  folderId: string | null
  reviewableIds: string[]
  selectedProductId: string | null
  quickView: boolean
  upload: boolean
  fullscreen: boolean
  goToFrame: number | null
}

const initialState: ViewerState = {
  ...initialStateFromQueryParams,
  isOpen: false,
  upload: false, // used to open upload file picker
  fullscreen: false,
  quickView: false, // used to open quick view mode (reduced UI for quick view)
  goToFrame: null,
}

const viewerSlice = createSlice({
  name: 'viewer',
  initialState,
  reducers: {
    openViewer: (state: ViewerState, { payload }: PayloadAction<Partial<ViewerState>>) => {
      state.projectName = payload.projectName || state.projectName
      state.quickView = !!payload.quickView

      if (payload.productId) state.productId = payload.productId
      if (payload.selectedProductId) state.selectedProductId = payload.selectedProductId
      if (payload.taskId) state.taskId = payload.taskId
      if (payload.folderId) state.folderId = payload.folderId

      if (payload.productId || payload.taskId || payload.folderId) state.isOpen = true

      if (payload.versionIds) state.versionIds = payload.versionIds
      if (payload.reviewableIds) state.reviewableIds = payload.reviewableIds || []
    },
    updateProduct: (
      state: ViewerState,
      { payload: { selectedProductId } }: PayloadAction<{ selectedProductId: string | null }>,
    ) => {
      state.selectedProductId = selectedProductId
      if (state.isOpen === false) state.isOpen = true
    },
    updateSelection: (
      state: ViewerState,
      {
        payload: { versionIds, reviewableIds, productId, quickView },
      }: PayloadAction<Partial<ViewerState>>,
    ) => {
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
      if (state.isOpen === false) state.isOpen = true
    },
    closeViewer: (state: ViewerState) => {
      state.versionIds = []
      state.projectName = null
      state.productId = null
      state.taskId = null
      state.folderId = null
      state.reviewableIds = []
      state.isOpen = false
      state.selectedProductId = null
    },
    toggleUpload: (state: ViewerState, { payload }: PayloadAction<boolean>) => {
      state.upload = payload
    },
    toggleFullscreen: (
      state: ViewerState,
      { payload }: PayloadAction<{ fullscreen: boolean } | undefined>,
    ) => {
      state.fullscreen = payload ? payload.fullscreen : !state.fullscreen
    },
    goToFrame: (state: ViewerState, { payload }: PayloadAction<ViewerState['goToFrame']>) => {
      state.goToFrame = payload
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
  goToFrame,
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
