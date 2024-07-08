import { createSlice } from '@reduxjs/toolkit'
import getInitialStateQueryParam from './middleware/getInitialStateQueryParam'

export const initialStateQueryParams = {
  projectName: { key: 'project_name', initial: null },
  productId: { key: 'review_product', initial: null },
  versionIds: { key: 'review_version', initial: [] },
  reviewableIds: { key: 'reviewable_id', initial: [] },
}
const initialStateFromQueryParams = Object.entries(initialStateQueryParams).reduce(
  (acc, [key, value]) => {
    acc[key] = getInitialStateQueryParam(value.key, value.initial)
    return acc
  },
  {},
)

const reviewSlice = createSlice({
  name: 'review',
  initialState: {
    ...initialStateFromQueryParams,
    upload: false, // used to open upload file picker
  },
  reducers: {
    openReview: (
      state,
      { payload: { versionIds, projectName, productId, reviewableIds } = {} } = {},
    ) => {
      state.productId = productId
      state.versionIds = versionIds
      state.projectName = projectName
      state.reviewableIds = reviewableIds || []
    },
    updateSelection: (state, { payload: { versionIds, reviewableIds } }) => {
      if (versionIds !== undefined) {
        state.versionIds = versionIds
      }
      if (reviewableIds !== undefined) {
        state.reviewableIds = reviewableIds
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
  },
})

export const { openReview, updateSelection, closeReview, toggleUpload } = reviewSlice.actions
export default reviewSlice.reducer

// create an object for each reducer to define which state fields it will update
const reviewReducerSearchParams = {
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

export const reviewSearchParams = Object.fromEntries(
  Object.entries(reviewReducerSearchParams).map(([key, value]) => {
    return [
      'review/' + key,
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
