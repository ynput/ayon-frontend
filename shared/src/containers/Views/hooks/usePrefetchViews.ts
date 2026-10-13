import {
  useGetBaseViewQuery,
  useGetDefaultViewQuery,
  useGetWorkingViewQuery,
  useListViewsQuery,
} from '@shared/api'

/**
 * Subscribes to the same queries ViewsProvider loads (keep the arguments in sync with
 * ViewsContext and useSelectedView), so they can start before the provider mounts.
 * Pages wait for views before they load their data, e.g. the project pages render
 * ViewsProvider only once the project has loaded.
 */
export const usePrefetchViews = ({
  viewType,
  projectName,
}: {
  viewType?: string
  projectName?: string
}) => {
  const skip = !viewType
  const args = { viewType: viewType as string, projectName }
  useGetDefaultViewQuery(args, { skip })
  useListViewsQuery(args, { skip })
  useGetWorkingViewQuery(args, { skip })
  useGetBaseViewQuery(args, { skip })
  useGetBaseViewQuery({ viewType: viewType as string, projectName: undefined }, { skip })
}
