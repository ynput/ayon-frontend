import { createSlice } from '@reduxjs/toolkit'
import { clearAccessToken, storeAccessToken } from '@shared/util/accessToken'

const userSlice = createSlice({
  name: 'user',
  initialState: {
    name: '',
    redirectUrl: null,
    avatarKey: '',
    uiExposureLevel: 0,
    data: {
      frontendPreferences: {
        notifications: false,
        notificationSound: false,
        pinnedProjects: [],
        expandedAccessGroups: {},
        filters: {},
        columnSizes: {},
        pageSettings: {},
      },
      isAdmin: false,
      isManager: false,
      isUser: true,
      isGuest: false,
    },
    attrib: {
      fullName: '',
      email: '',
      avatarUrl: '',
      developerMode: false,
    },
  },
  reducers: {
    login: (state, action) => {
      if (action.payload.accessToken) storeAccessToken(action.payload.accessToken)

      const user = { ...action.payload.user, data: { ...action.payload.user?.data } }
      // set if isUser
      let isUser = true
      if (user.data) {
        if (user.data.isAdmin || user.data.isManager) isUser = false
        user.data.isUser = isUser
      }

      if (action.payload.redirectUrl) {
        user.redirectUrl = action.payload.redirectUrl
      }

      return user
    },

    logout: (state) => {
      clearAccessToken()
      state = {}
      return state
    },
    updateUserAttribs: (state, action) => {
      if (!state.attrib) return
      state.attrib = { ...state.attrib, ...action.payload }
    },
    updateUserData: (state, action) => {
      if (!state.data) return
      state.data = { ...state.data, ...action.payload }
    },
    toggleDevMode: (state, action) => {
      if (!state.attrib) return
      state.attrib.developerMode = action.payload
    },
    updateUserPreferences: (state, action) => {
      if (!state.data) return
      state.data.frontendPreferences = {
        ...(state.data?.frontendPreferences || {}),
        ...action.payload,
      }
    },
    updateAvatarKey: (state) => {
      state.avatarKey = `?${Date.now()}`
    },
  },
})

export const {
  login,
  logout,
  updateUserAttribs,
  updateUserData,
  updateUserPreferences,
  toggleDevMode,
  updateAvatarKey,
} = userSlice.actions
export default userSlice.reducer
