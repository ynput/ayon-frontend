import { createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const FRONTEND_BUNDLE_MODES = {
  production: 'production',
  staging: 'staging',
  developer: 'developer',
}

const DEFAULT_FRONTEND_PREFERENCES = {
  notifications: false,
  notificationSound: false,
  pinnedProjects: [],
  expandedAccessGroups: {},
  filters: {},
  columnSizes: {},
  pageSettings: {},
  frontendBundleMode: FRONTEND_BUNDLE_MODES.production,
}

const sanitizeFrontendBundleMode = (frontendBundleMode, isDeveloper = false) => {
  if (frontendBundleMode === FRONTEND_BUNDLE_MODES.staging) return FRONTEND_BUNDLE_MODES.staging
  if (frontendBundleMode === FRONTEND_BUNDLE_MODES.developer && isDeveloper) {
    return FRONTEND_BUNDLE_MODES.developer
  }

  return FRONTEND_BUNDLE_MODES.production
}

const syncFrontendBundleMode = (state) => {
  if (!state.data) return

  const frontendBundleMode = sanitizeFrontendBundleMode(
    state.data?.frontendPreferences?.frontendBundleMode,
    state.data?.isDeveloper,
  )

  state.data.frontendPreferences = {
    ...DEFAULT_FRONTEND_PREFERENCES,
    ...(state.data?.frontendPreferences || {}),
    frontendBundleMode,
  }

  if (state.attrib) {
    state.attrib.developerMode = frontendBundleMode === FRONTEND_BUNDLE_MODES.developer
  }
}

const userSlice = createSlice({
  name: 'user',
  initialState: {
    name: '',
    redirectUrl: null,
    avatarKey: '',
    uiExposureLevel: 0,
    data: {
      frontendPreferences: DEFAULT_FRONTEND_PREFERENCES,
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

      const user = {
        ...action.payload.user,
        data: {
          ...action.payload.user?.data,
          frontendPreferences: {
            ...DEFAULT_FRONTEND_PREFERENCES,
            ...(action.payload.user?.data?.frontendPreferences || {}),
          },
        },
        attrib: { ...(action.payload.user?.attrib || {}) },
      }
      // set if isUser
      let isUser = true
      if (user.data) {
        if (user.data.isAdmin || user.data.isManager) isUser = false
        user.data.isUser = isUser
      }

      const frontendBundleMode = sanitizeFrontendBundleMode(
        user.data?.frontendPreferences?.frontendBundleMode,
        user.data?.isDeveloper,
      )

      user.data.frontendPreferences.frontendBundleMode = frontendBundleMode
      user.attrib.developerMode = frontendBundleMode === FRONTEND_BUNDLE_MODES.developer

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
      syncFrontendBundleMode(state)
    },
    updateUserPreferences: (state, action) => {
      if (!state.data) return
      state.data.frontendPreferences = {
        ...DEFAULT_FRONTEND_PREFERENCES,
        ...(state.data?.frontendPreferences || {}),
        ...action.payload,
      }
      syncFrontendBundleMode(state)
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
  updateAvatarKey,
} = userSlice.actions
export default userSlice.reducer
