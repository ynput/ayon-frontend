import { createSlice } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'

export const filterActivityTypes = {
  activity: ['comment', 'version.publish', 'status.change', 'assignee.add', 'assignee.remove'],
  comments: ['comment'],
  publishes: ['version.publish'],
  checklists: ['checklist'],
}

const detailsSlice = createSlice({
  name: 'details',
  initialState: {
    pinned: {
      filter: getInitialStateLocalStorage('details/filter', 'activity'),
      activityTypes:
        filterActivityTypes[getInitialStateLocalStorage('details/filter', 'activity')] || [],
      tab: 'feed', // feed | attribs | representations
    },
    slideOut: {
      entityType: '',
      entityId: '',
      projectName: '',
      filter: 'activity',
      activityTypes: filterActivityTypes.activity,
      tab: 'feed', // feed | attribs | representations
      scope: 'dashboard', // dashboard | project
    },
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
      // open slide out
      state.slideOut.entityType = payload.entityType
      state.slideOut.entityId = payload.entityId
      state.slideOut.projectName = payload.projectName

      //   reset if tab = representation and entityType is not version
      if (payload.tab === 'representations' && payload.entityType !== 'version') {
        payload.tab = 'attribs'
      }

      state.slideOut.tab = payload.tab || state.slideOut.tab
    },
    closeSlideOut: (state) => {
      state.slideOut.entityType = ''
      state.slideOut.entityId = ''
      state.slideOut.projectName = ''
    },
  },
})

export const { updateDetailsPanelTab, updateFeedFilter, openSlideOut, closeSlideOut } =
  detailsSlice.actions
export default detailsSlice.reducer

// topics that need to set localStorage. If there is no explicit value, it will be the payload value
export const detailsLocalItems = {
  'dashboard/updateFeedFilter': [{ key: 'details/filter' }],
}
