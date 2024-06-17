import { createSlice } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'
import getInitialStateQueryParam from './middleware/getInitialStateQueryParam'

export const filterActivityTypes = {
  activity: ['comment', 'version.publish', 'status.change', 'assignee.add', 'assignee.remove'],
  comments: ['comment'],
  publishes: ['version.publish'],
  checklists: ['checklist'],
}

const initialStateSlideOut = {
  entityType: '',
  entityId: '',
  projectName: '',
}

const initialTooltip = {
  id: null,
  type: '',
  name: '',
  label: '',
  pos: {},
}

const scopes = ['dashboard', 'project', 'inbox', 'preview']

const detailsSlice = createSlice({
  name: 'details',
  initialState: {
    pinned: {
      filter: getInitialStateLocalStorage('details/filter', 'activity'),
      activityTypes:
        filterActivityTypes[getInitialStateLocalStorage('details/filter', 'activity')] || [],
      tab: 'feed', // feed | attribs | representations,
      highlighted: getInitialStateQueryParam('highlighted', []),
    },
    slideOut: {
      dashboard: initialStateSlideOut,
      project: initialStateSlideOut,
      filter: 'activity',
      activityTypes: filterActivityTypes.activity,
      tab: 'feed', // feed | attribs | representations,
      highlighted: [],
    },
    refTooltip: initialTooltip,
  },
  reducers: {
    updateDetailsPanelTab: (state, { payload }) => {
      const location = payload.isSlideOut ? 'slideOut' : 'pinned'

      // toggle the details open
      state[location].tab = payload.tab
    },
    updateFeedFilter: (state, { payload }) => {
      const location = payload.isSlideOut ? 'slideOut' : 'pinned'
      state[location].filter = payload.value
      state[location].activityTypes =
        filterActivityTypes[payload.value] || filterActivityTypes.activity
      // switch back to feed tab
      state[location].tab = 'feed'
    },
    openSlideOut: (state, { payload }) => {
      const scope = payload.scope
      if (!scope && scopes.includes(scope)) return
      // open slide out
      state.slideOut[scope].entityType = payload.entityType
      state.slideOut[scope].entityId = payload.entityId
      state.slideOut[scope].projectName = payload.projectName
      // close all other scopes
      for (const s of scopes) {
        if (s !== scope) {
          state.slideOut[s] = initialStateSlideOut
        }
      }

      state.slideOut.tab = payload.tab || state.slideOut.tab

      if (payload.activityId) {
        // set highlighted activity
        state.slideOut.highlighted = [payload.activityId]
      }
      // hide tooltip
      state.refTooltip = initialTooltip
    },
    closeSlideOut: (state) => {
      for (const scope of scopes) {
        state.slideOut[scope] = initialStateSlideOut
      }
    },
    highlightActivity: (state, { payload: { isSlideOut = false, activityIds } = {} }) => {
      const location = isSlideOut ? 'slideOut' : 'pinned'
      state[location].highlighted = activityIds
    },
    clearHighlights: (state, { payload: { isSlideOut = false } = {} }) => {
      const location = isSlideOut ? 'slideOut' : 'pinned'
      state[location].highlighted = []
    },
    showRefTooltip: (state, { payload }) => {
      // open tooltip
      state.refTooltip = payload
    },
    hideRefTooltip: (state) => {
      // hide tooltip
      state.refTooltip = initialTooltip
    },
  },
})

export const {
  updateDetailsPanelTab,
  updateFeedFilter,
  openSlideOut,
  closeSlideOut,
  highlightActivity,
  clearHighlights,
  showRefTooltip,
  hideRefTooltip,
} = detailsSlice.actions
export default detailsSlice.reducer

// topics that need to set localStorage. If there is no explicit value, it will be the payload value
export const detailsLocalItems = {
  'dashboard/updateFeedFilter': [{ key: 'details/filter' }],
}
