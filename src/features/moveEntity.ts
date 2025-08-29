import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type NewEntityType = 'folder' | 'task'

export interface EntityMoveData {
    entityId: string
    entityType: NewEntityType
    name?: string
    currentParentId?: string
}

export interface MultiEntityMoveData {
    entities: EntityMoveData[]
}

export interface MoveEntityState {
    movingEntities: MultiEntityMoveData | null
    isEntityPickerOpen: boolean
}

const initialState: MoveEntityState = {
    movingEntities: null,
    isEntityPickerOpen: false,
}

const moveEntitySlice = createSlice({
    name: 'moveEntity',
    initialState,
    reducers: {
        openMoveDialog: (state, action: PayloadAction<EntityMoveData | MultiEntityMoveData>) => {
            // Convert single entity to multi-entity format
            const multiEntityData: MultiEntityMoveData = 'entities' in action.payload
                ? action.payload
                : { entities: [action.payload] }
            state.movingEntities = multiEntityData
            state.isEntityPickerOpen = true
        },
        closeMoveDialog: (state) => {
            state.movingEntities = null
            state.isEntityPickerOpen = false
        },
        setEntityPickerOpen: (state, action: PayloadAction<boolean>) => {
            state.isEntityPickerOpen = action.payload
        },
        clearMovingEntities: (state) => {
            state.movingEntities = null
        },
    },
})

export const {
    openMoveDialog,
    closeMoveDialog,
    setEntityPickerOpen,
    clearMovingEntities,
} = moveEntitySlice.actions

export default moveEntitySlice.reducer