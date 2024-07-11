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
    progress: {}, // keep track of progress of transcoding
  },
  reducers: {
    openReview: (
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
    closeReview: (state) => {
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
    updateProgress: (state, { payload: { progress, fileId } }) => {
      // if progress is 100, remove the fileId from the progress object
      if (progress >= 100 || progress < 0) {
        delete state.progress[fileId]
      } else {
        state.progress[fileId] = progress
      }
    },
  },
})

export const {
  openReview,
  updateSelection,
  closeReview,
  toggleUpload,
  toggleFullscreen,
  updateProgress,
} = viewerSlice.actions
export default viewerSlice.reducer

// create an object for each reducer to define which state fields it will update
const viewerReducerSearchParams = {
  openReview: ['productId', 'versionIds', 'projectName', 'reviewableIds'],
  updateSelection: ['versionIds', 'reviewableIds'],
  closeReview: [
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
