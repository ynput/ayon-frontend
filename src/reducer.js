import { combineReducers } from 'redux'

const userReducer = (state = {}, action) => {
  switch (action.type) {
    case 'LOGIN':
      if (action.accessToken) {
        localStorage.setItem('accessToken', action.accessToken)
      }
      return action.user

    case 'LOGOUT':
      localStorage.removeItem('accessToken')
      return {}

    default:
      return state
  }
}

const DEFAULT_CONTEXT = {
  projectName: null,
  project: {},
  focusedType: null,
  focusedFolders: [],
  focusedSubsets: [],
  focusedVersions: [],
}

const contextReducer = (state = DEFAULT_CONTEXT, action) => {
  switch (action.type) {
    case 'SELECT_PROJECT':
      window.localStorage.setItem('currentProject', action.name)
      return {
        ...DEFAULT_CONTEXT,
        projectName: action.name,
      }
    case 'SET_PROJECT_DATA':
      return {
        ...state,
        project: action.data,
      }
    case 'SET_FOCUSED_FOLDERS':
      return {
        ...state,
        focusedType: 'folder',
        focusedFolders: action.objects,
        focusedSubsets: [],
        focusedVersions: [],
      }
    case 'SET_FOCUSED_SUBSETS':
      return {
        ...state,
        focusedType: 'subset',
        focusedSubsets: action.objects,
      }
    case 'SET_FOCUSED_VERSIONS':
      return {
        ...state,
        focusedType: 'version',
        focusedVersions: action.objects,
      }
    case 'CLEAR_FOCUS':
      return {
        ...state,
        focusedType: null,
      }

    case 'SET_BREADCRUMBS':
      let bc = state.breadcrumbs || {}
      if (action.parents) {
        bc.parents = action.parents
        bc.folder = null
        bc.subset = null
        bc.version = null
        bc.representation = null
      }
      if (action.folder) {
        bc.folder = action.folder
        bc.subset = null
        bc.version = null
        bc.representation = null
      }
      if (action.subset) {
        bc.subset = action.subset
        bc.version = null
        bc.representation = null
      }
      if (action.version) {
        bc.version = action.version
        bc.representation = null
      }
      if (action.representation) {
        bc.representation = action.representation
      }

      return {
        ...state,
        breadcrumbs: bc,
      }
    default:
      return state
  }
}

const reducer = combineReducers({ userReducer, contextReducer })
export default reducer
