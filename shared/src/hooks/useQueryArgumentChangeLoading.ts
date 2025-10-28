import { useRef, useEffect, useState } from 'react'

/**
 * Hook that tracks when query arguments change and only shows loading state
 * when arguments change, not during revalidation of the same query.
 *
 * @param args - The query arguments to track
 * @param isFetching - The fetching state from the query
 * @returns boolean indicating if loading should be shown
 */
export const useQueryArgumentChangeLoading = <T extends Record<string, any>>(
  args: T,
  isFetching: boolean,
): boolean => {
  const prevArgsRef = useRef<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const prevArgs = prevArgsRef.current

    // Check if arguments have changed by comparing all properties
    const argsChanged =
      !prevArgs ||
      Object.keys(args).some((key) => prevArgs[key] !== args[key]) ||
      Object.keys(prevArgs).some((key) => prevArgs[key] !== args[key])

    if (argsChanged) {
      // Arguments changed or this is the initial load, update the ref first
      prevArgsRef.current = { ...args }
      // Show loading state when fetching (both for initial load and argument changes)
      setIsLoading(isFetching)
    } else if (!isFetching) {
      // Arguments haven't changed and not fetching - this means the query completed
      // Only set to false when not fetching to avoid flickering
      setIsLoading(false)
    }
    // If argsChanged is false and isFetching is true, keep current loading state
    // This handles the case where the same query is revalidating
  }, [Object.values(args).join(','), isFetching])

  return isLoading
}
