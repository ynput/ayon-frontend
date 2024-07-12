import { createSlice } from '@reduxjs/toolkit'
import getInitialStateQueryParam from './middleware/getInitialStateQueryParam'

export const initialStateQueryParams = {
  projectName: { key: 'project_name', initial: null },
  productId: { key: 'viewer_product', initial: null },
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
    upload: false, // used to open upload file picker
    fullscreen: false,
    quickView: false, // used to open quick view mode (reduced UI for quick view)
  },
  reducers: {
    openViewer: (
      state,
      { payload: { versionIds, projectName, productId, reviewableIds, quickView } = {} } = {},
    ) => {
      state.productId = productId
      state.versionIds = versionIds
      state.projectName = projectName
      state.reviewableIds = reviewableIds || []
      state.quickView = !!quickView
    },
    updateSelection: (state, { payload: { versionIds, reviewableIds, quickView } }) => {
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
      state.reviewableIds = null
    },
    toggleUpload: (state, { payload }) => {
      state.upload = payload
    },
    toggleFullscreen: (state, { payload }) => {
      state.fullscreen = payload ? payload.fullscreen : !state.fullscreen
    },
  },
})

export const { openViewer, updateSelection, closeViewer, toggleUpload, toggleFullscreen } =
  viewerSlice.actions
export default viewerSlice.reducer

// create an object for each reducer to define which state fields it will update
const viewerReducerSearchParams = {
  openViewer: ['productId', 'versionIds', 'projectName', 'reviewableIds'],
  updateSelection: ['versionIds', 'reviewableIds'],
  closeViewer: [
    { state: 'versionIds', value: [] },
    { state: 'projectName', value: null },
    { state: 'productId', value: null },
    { state: 'reviewableIds', value: [] },
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
