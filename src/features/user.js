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
      state = action.payload.user
      return state
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
