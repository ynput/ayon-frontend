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
  },
})

export const { login, logout } = userSlice.actions
export default userSlice.reducer
