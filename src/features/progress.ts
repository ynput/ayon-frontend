import { createSlice } from '@reduxjs/toolkit'

interface ProgressState {
  selected: {
    ids: string[]
    type: 'task' | 'folder'
  }
  detailsOpen: boolean
}

const initialState = {
  selected: {
    ids: [],
    type: 'task',
  },
  detailsOpen: false,
} satisfies ProgressState as ProgressState

const counterSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    selectProgress: (state, action: { payload: ProgressState['selected'] }) => {
      state.selected = action.payload
    },
    toggleDetailsOpen: (state, action: { payload: boolean }) => {
      state.detailsOpen = action.payload
    },
  },
})

export const { selectProgress, toggleDetailsOpen } = counterSlice.actions
export default counterSlice.reducer
