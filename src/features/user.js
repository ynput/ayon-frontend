import { createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const userSlice = createSlice({
  name: 'user',
  initialState: {
    name: '',
    redirectUrl: null,
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
      if (action.payload.accessToken) {
        localStorage.setItem('accessToken', action.payload.accessToken)
        axios.defaults.headers.common['Authorization'] = `Bearer ${action.payloadaccessToken}`
        document.cookie = `accessToken=${action.payload.accessToken}; path=/; max-age=86400`
      }

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
      localStorage.removeItem('accessToken')
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
  },
})

export const {
  login,
  logout,
  updateUserAttribs,
  updateUserData,
  updateUserPreferences,
  toggleDevMode,
} = userSlice.actions
export default userSlice.reducer
