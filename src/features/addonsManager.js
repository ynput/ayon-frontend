import { createSlice } from '@reduxjs/toolkit'

const addonsManagerSlice = createSlice({
  name: 'addonsManager',
  initialState: {
    selectedAddons: [],
    selectedVersions: [],
    selectedBundles: [],
  },
  reducers: {
    onSelectedAddons: (state, action) => {
      state.selectedAddons = action.payload
    },
    onSelectedVersions: (state, action) => {
      state.selectedVersions = action.payload
    },
    onSelectedBundles: (state, action) => {
      state.selectedBundles = action.payload
    },
  },
})

export const { onSelectedAddons, onSelectedVersions, onSelectedBundles } =
  addonsManagerSlice.actions

export default addonsManagerSlice.reducer
