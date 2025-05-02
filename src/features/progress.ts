import { createSlice } from '@reduxjs/toolkit'

export interface ProgressState {
  selected: {
    ids: string[]
    type: 'task' | 'folder'
  }
}

const initialState = {
  selected: {
    ids: [],
    type: 'task',
  },
} satisfies ProgressState as ProgressState

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    selectProgress: (state, action: { payload: ProgressState['selected'] }) => {
      state.selected = action.payload
    },
  },
})

export const { selectProgress } = progressSlice.actions
export default progressSlice.reducer
