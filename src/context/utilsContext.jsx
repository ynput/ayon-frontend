import { createContext } from 'react'
import { useSelector } from 'react-redux'

// create react context boiler plate
export const UtilContext = createContext()

// export context provider
export const UtilProvider = (props) => {
  const families = useSelector((state) => state.project.families) || {}

  const error = 'error'

  const familiesDefaults = {
    icon: 'help_center',
  }
  const getFamilyField = (family, field) => {
    if (!field) {
      console.log('No field provided to getFamily')
      return error
    }
    const icon = (families[family] && families[family][field]) || familiesDefaults[field]

    return icon
  }

  return (
    <UtilContext.Provider
      value={{
        getFamilyField,
      }}
    >
      {props.children}
    </UtilContext.Provider>
  )
}
