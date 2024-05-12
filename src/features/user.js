import { createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const userSlice = createSlice({
  name: 'user',
  initialState: {},
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

      return user
    },

    logout: (state) => {
      localStorage.removeItem('accessToken')
      state = {}
      return state
    },
    onProfileUpdate: (state, action) => {
      if (!state.attrib) return
      state.attrib = { ...state.attrib, ...action.payload }
    },
    setUserData: (state, action) => {
      if (!state.attrib) return
      state.data = { ...state.data, ...action.payload }
    },
  },
})

export const { login, logout, onProfileUpdate, setUserData } = userSlice.actions
export default userSlice.reducer
