// this hook converts the columns settings from a view into the format used by tanstack/react-table

import { useViewsContext } from '../context/ViewsContext'

type Props = {}

export const usePageViewColumns = () => {
  // this views context is per page/project
  const { viewSettings } = useViewsContext()

  console.log(viewSettings)

  return {}
}
