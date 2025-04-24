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
  filter: 'activity',
  activityTypes: filterActivityTypes.activity,
  tab: 'feed', // feed | attribs | files,
}

const initialPip = {
  entityType: '',
  entities: [],
  scope: '',
  statePath: '',
}

const initialStatePinned = {
  filter: getInitialStateLocalStorage('details/filter', 'activity'), // activity | comments | publishes | checklists
  activityTypes:
    filterActivityTypes[getInitialStateLocalStorage('details/filter', 'activity')] || [],
  tab: 'feed', // feed | attribs | files,
}

const initialExtra = {
  overview: {
    selectedEntityIds: [],
    entityType: null,
  },
}

const scopes = ['dashboard', 'project', 'inbox', 'review', 'progress', 'overview']

const detailsSlice = createSlice({
  name: 'details',
  initialState: {
    open: false,
    pinned: {
      highlighted: getInitialStateQueryParam('highlighted', []),
      // scoped
      ...scopes.reduce((acc, scope) => {
        const initialScope = initialExtra[scope] || {}
        acc[scope] = { ...initialStatePinned, ...initialScope }
        return acc
      }, {}),
    },
    slideOut: {
      highlighted: [],
      // scoped
      ...scopes.reduce((acc, scope) => {
        acc[scope] = initialStateSlideOut
        return acc
      }, {}),
    },
    pip: initialPip,
  },
  reducers: {
    updateDetailsPanelTab: (state, { payload }) => {
      const scope = payload.scope
      const location = payload.statePath

      // toggle the details open
      state[location][scope].tab = payload.tab
    },
    updateFeedFilter: (state, { payload }) => {
      const scope = payload.scope
      const location = payload.statePath
      state[location][scope].filter = payload.value
      state[location][scope].activityTypes =
        filterActivityTypes[payload.value] || filterActivityTypes.activity
      // switch back to feed tab
      state[location][scope].tab = 'feed'
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

      state.slideOut[scope].tab = payload.tab || state.slideOut[scope].tab

      if (payload.activityId) {
        // set highlighted activity
        state.slideOut.highlighted = [payload.activityId]
      }
    },
    closeSlideOut: (state) => {
      for (const scope of scopes) {
        state.slideOut[scope] = initialStateSlideOut
      }
    },
    highlightActivity: (state, { payload: { statePath = 'pinned', activityIds } = {} }) => {
      const location = statePath
      state[location].highlighted = activityIds
    },
    clearHighlights: (state, { payload: { statePath = 'pinned' } = {} }) => {
      const location = statePath
      state[location].highlighted = []
    },
    toggleDetailsPanel: (state, { payload }) => {
      if (payload !== undefined) {
        state.open = payload
      } else {
        state.open = !state.open
      }
    },
    selectEntities: (state, { payload: { entityIds, entityType, scope } }) => {
      //   if there is a scope, set the selectedEntityIds
      if (scope && state.pinned[scope]?.selectedEntityIds) {
        state.pinned[scope].selectedEntityIds = entityIds
        state.pinned[scope].entityType = entityType
      }
    },
    openPip: (state, { payload }) => {
      state.pip = payload
    },
    closePip: (state) => {
      state.pip = initialStateSlideOut
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
  toggleDetailsPanel,
  selectEntities,
  openPip,
  closePip,
} = detailsSlice.actions
export default detailsSlice.reducer

// topics that need to set localStorage. If there is no explicit value, it will be the payload value
export const detailsLocalItems = {
  'dashboard/updateFeedFilter': [{ key: 'details/filter' }],
}
