import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface CounterState {
  open: boolean
}

const initialState = { open: false } satisfies CounterState as CounterState

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    // open/close the dialog
    toggleReleaseInstaller: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload
    },
  },
})

export const { toggleReleaseInstaller } = counterSlice.actions
export default counterSlice.reducer
