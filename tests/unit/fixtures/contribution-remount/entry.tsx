// Bundled by slotInspectorRemount.spec.ts for a page: one contribution with state, rendered by
// ContributionView, and the switches the slot inspector drives.
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ContributionView } from '../../../../addon/src/ContributionView'
import { provideHost } from '../../../../addon/src/hostBridge'
import { setContributionTags, setContributionWrappers } from '../../../../addon/src/registry'

const counts = { mounts: 0, unmounts: 0 }
const Content = () => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    counts.mounts++
    return () => {
      counts.unmounts++
    }
  }, [])
  return (
    <button id="counter" onClick={() => setCount((c) => c + 1)}>
      {count}
    </button>
  )
}

const user = { name: 'test', isAdmin: true, isManager: false, isGuest: false }
provideHost({ useUser: () => user, getUser: () => user } as never)
const contribution = {
  addon: { name: 'test', version: '1', remote: 'test' },
  id: 'content',
  key: 'test.content',
  slot: 'detailsPanel.tab',
  label: 'Test',
  component: () => Promise.resolve({ default: Content }),
}
const context = { projectName: 'test', entities: [] }
// developer mode is on: the slot inspector is available, Show slots off
setContributionWrappers(true)

createRoot(document.getElementById('root')!).render(
  <ContributionView contribution={contribution as never} context={context as never} />,
)
Object.assign(window, { setContributionTags, counts: () => ({ ...counts }) })
