// Addon sections on the profile page (Account → Profile, profile.section slot, @ynput/ayon-addon),
// next to AYON's profile form. Used by the app's ProfilePage and by the dev shell.
import { useMemo } from 'react'
import { ContributionView, useContributions } from '@ynput/ayon-addon'
import type { ProfileSectionContext } from '@ynput/ayon-addon'
import { Panel } from '@ynput/ayon-react-components'
import { usePowerpack } from '@shared/context'

// the slot's context has nothing besides the signed-in user, which ContributionView adds
const context: ProfileSectionContext = {}

/**
 * The addons' sections, each in a panel titled like AYON's own. A power feature's section shows
 * only with a Power Pack licence; without one the page shows AYON's preview of it instead.
 */
export const AddonProfileSections = () => {
  const { contributions } = useContributions('profile.section')
  const { powerLicense, isLoading } = usePowerpack()
  const sections = useMemo(
    () =>
      contributions
        .filter((section) => !section.powerFeature || (powerLicense && !isLoading))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [contributions, powerLicense, isLoading],
  )

  return (
    <>
      {sections.map((section) => (
        <Panel key={section.key} data-addon-section={section.key}>
          <b className="profile-card-header">{section.title}</b>
          <ContributionView contribution={section} context={context} />
        </Panel>
      ))}
    </>
  )
}
