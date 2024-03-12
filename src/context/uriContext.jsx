import React, { createContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router'
import { setUri } from '../features/context'

const URIContext = createContext()

function URIProvider(props) {
  const location = useLocation()
  const uri = useSelector((state) => state.context.uri)
  const dispatch = useDispatch()

  // check uri makes sense within route
  useEffect(() => {
    if (uri) {
      // check project uri
      if (uri.startsWith('ayon+entity')) {
        if (!location.pathname.startsWith('/projects')) {
          // but we are not in a project page
          dispatch(setUri(null))
        }
      }
    }
  }, [location, uri, dispatch, setUri])

  return <URIContext.Provider value={{}}>{props.children}</URIContext.Provider>
}

export { URIProvider }
