import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type ReleaseFormType = 'overview' | 'addons' | 'installers' | 'progress'

interface ReleaseState {
  open: boolean
  dialog: ReleaseFormType
  release: string | null
}

const initialState = {
  open: false,
  release: null,
  dialog: 'overview',
} satisfies ReleaseState as ReleaseState

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    // open/close the dialog
    toggleReleaseInstaller: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload
      // always set overview dialog
      state.dialog = 'overview'
    },
    installRelease: (state, action: PayloadAction<string>) => {
      // set the release to install
      state.release = action.payload
      // open the dialog
      state.open = true
      // set the dialog to overview
      state.dialog = 'overview'
    },
    switchDialog: (state, action: PayloadAction<ReleaseFormType>) => {
      state.dialog = action.payload
    },
  },
})

export const { toggleReleaseInstaller, switchDialog } = counterSlice.actions
export default counterSlice.reducer
