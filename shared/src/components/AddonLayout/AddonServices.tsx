// Addon services (app.service slot, @ynput/ayon-addon): components with no UI, mounted once for
// the whole app under its providers and kept mounted from page to page. Used by the app and by the
// dev shell.
import { useMemo } from 'react'
import { ContributionView, useContributions } from '@ynput/ayon-addon'
import type { AnyContribution } from '@ynput/ayon-addon'
import { ReportCrash } from './AddonDialog'

// a crashed service stays unmounted until the page reloads: it has no place to show an error box
const noop = () => undefined

export const AddonServices = ({ projectName }: { projectName: string | null }) => {
  const { contributions } = useContributions('app.service')
  const context = useMemo(() => ({ projectName }), [projectName])
  return (
    <>
      {contributions.map((service) => (
        <ContributionView
          key={service.key}
          contribution={service}
          context={context}
          error={(error) => (
            <ReportCrash
              contribution={service as unknown as AnyContribution}
              error={error}
              onReported={noop}
            />
          )}
        />
      ))}
    </>
  )
}
