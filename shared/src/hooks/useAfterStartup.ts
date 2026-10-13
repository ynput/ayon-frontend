import { useEffect, useState } from 'react'
import { afterStartup } from '@shared/util/afterStartup'

/**
 * False until the page has had time to load (see afterStartup), then true.
 * Use it to skip queries nobody waits for on load, e.g. prompts and banners,
 * so they don't compete with the page's own requests.
 */
export const useAfterStartup = (delay?: number) => {
  const [isReady, setIsReady] = useState(false)
  useEffect(() => afterStartup(() => setIsReady(true), delay), [delay])
  return isReady
}
