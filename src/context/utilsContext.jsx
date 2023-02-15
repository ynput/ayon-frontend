import { createContext } from 'react'
import { useSelector } from 'react-redux'

// create react context boiler plate
export const UtilContext = createContext()

// export context provider
export const UtilProvider = (props) => {
  const project = useSelector((state) => state.project) || {}

  const errors = {
    icon: 'error',
    color: 'red',
    shortName: 'ERR',
  }

  const defaults = {
    families: {
      icon: 'help_center',
    },
    folders: {
      icon: 'folder',
    },
    tasks: {
      icon: 'task',
    },
    tags: {
      color: 'white',
    },
    statuses: {
      color: '#c0c0c0',
      icon: 'radio_button_checked',
      shortName: 'ERR',
    },
  }

  // type = 'folders' or 'families'
  // subType = 'shot' or 'render'
  // field = 'icon' or 'color'
  const getTypeField = (type, subType, field) => {
    // if field is an array, start recursion
    if (Array.isArray(field)) {
      return field.map((f) => getTypeField(type, subType, f))
    }

    // check field is valid
    if (!field || !(field in errors)) return console.log('No Field Provided')

    // check if type is valid
    if (!type || !(type in defaults) || !(type in project)) return errors[field]

    // check if subType and field is valid on project
    if (!subType || !(subType in project[type] && field in project[type][subType]))
      return defaults[type][field]

    // get field from project type
    return project[type][subType][field]
  }

  return (
    <UtilContext.Provider
      value={{
        getTypeField,
      }}
    >
      {props.children}
    </UtilContext.Provider>
  )
}
