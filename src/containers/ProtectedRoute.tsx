import { Navigate, Outlet, useLocation } from 'react-router-dom'

type ProtectedRouteProps = {
  isAllowed: boolean
  redirectPath?: string
  children?: React.ReactNode
  preserveParams?: string[]
}

const ProtectedRoute = ({
  isAllowed,
  redirectPath = '/',
  children,
  preserveParams = [],
}: ProtectedRouteProps) => {
  const location = useLocation()

  if (!isAllowed) {
    let redirectTo = redirectPath

    // Preserve specified query parameters
    if (preserveParams.length > 0) {
      const searchParams = new URLSearchParams(location.search)
      const paramsToPreserve = new URLSearchParams()

      preserveParams.forEach((param) => {
        const value = searchParams.get(param)
        if (value) {
          paramsToPreserve.set(param, value)
        }
      })

      const preservedQuery = paramsToPreserve.toString()
      if (preservedQuery) {
        redirectTo = `${redirectPath}?${preservedQuery}`
      }
    }

    console.log(`User does not have access to ${location.pathname}, redirecting to ${redirectTo}`)

    return <Navigate to={redirectTo} replace />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute
