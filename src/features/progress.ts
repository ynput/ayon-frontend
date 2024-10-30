import { createSlice } from '@reduxjs/toolkit'

interface ProgressState {
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

const counterSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    selectProgress: (state, action: { payload: ProgressState['selected'] }) => {
      state.selected = action.payload
    },
  },
})

export const { selectProgress } = counterSlice.actions
export default counterSlice.reducer
