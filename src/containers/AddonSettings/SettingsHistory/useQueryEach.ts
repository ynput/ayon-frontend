import { useEffect, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'

type QueryState<Result> = {
  data?: Result
  isError: boolean
  isSuccess: boolean
}

type QueryEndpoint<Arg, Result> = {
  initiate: (arg: Arg) => any
  select: (arg: Arg) => (state: any) => QueryState<Result>
}

/**
 * Runs one query per argument, for a list whose length changes (selected addons, event ids).
 * Each argument keeps its own cache entry, so adding one only fetches that one.
 */
export const useQueryEach = <Arg, Result>(
  endpoint: QueryEndpoint<Arg, Result>,
  args: Arg[],
): QueryState<Result>[] => {
  const dispatch = useDispatch()
  const key = JSON.stringify(args)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableArgs = useMemo(() => args, [key])

  useEffect(() => {
    const subscriptions = stableArgs.map((arg) => dispatch(endpoint.initiate(arg)))
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe())
  }, [stableArgs, endpoint, dispatch])

  const selectors = useMemo(
    () => stableArgs.map((arg) => endpoint.select(arg)),
    [stableArgs, endpoint],
  )
  return useSelector((state) => selectors.map((select) => select(state)), shallowEqual)
}
