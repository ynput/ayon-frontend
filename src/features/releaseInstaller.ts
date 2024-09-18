import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import getInitialStateLocalStorage from './middleware/getInitialStateLocalStorage'

export type ReleaseFormType = 'overview' | 'addons' | 'installers' | 'progress'

interface ReleaseState {
  open: boolean
  dialog: ReleaseFormType
  release: string | null
}

const initialState = {
  open: getInitialStateLocalStorage('releaseInstaller-open', false) as boolean,
  release: null,
  dialog: 'overview',
} satisfies ReleaseState as ReleaseState

const counterSlice = createSlice({
  name: 'releaseInstaller',
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

// topics that need to set localStorage. If there is no explicit value, it will be the payload value
export const releaseInstallerLocalItems = {
  'releaseInstaller/toggleReleaseInstaller': [{ key: 'releaseInstaller-open' }],
  'releaseInstaller/installRelease': [{ key: 'releaseInstaller-open', value: true }],
}
