// Addon sections in the user details panel (Settings → Users, userDetails.section slot,
// @ynput/ayon-addon), below AYON's forms. The context and the "more" menu's addon items
// (userDetails.menuItem) are in addonUserDetailsHelpers.ts. Used by the app's UserDetail and by
// the dev shell.
import { useMemo } from 'react'
import { ContributionView, useContributions } from '@ynput/ayon-addon'
import type { UserDetailsContext } from '@ynput/ayon-addon'
import { Panel } from '@ynput/ayon-react-components'
import { showsForSelection } from './addonUserDetailsHelpers'

interface AddonUserDetailsSectionsProps {
  context: UserDetailsContext
}

/** The addons' sections, each in a panel titled like AYON's own. */
export const AddonUserDetailsSections = ({ context }: AddonUserDetailsSectionsProps) => {
  const { contributions } = useContributions('userDetails.section')
  const hasServiceUser = context.users.some((user) => user.isService)
  const sections = useMemo(
    () =>
      contributions
        .filter((section) => showsForSelection(section.selection, context.users.length))
        .filter((section) => !hasServiceUser || section.serviceUsers)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [contributions, context.users.length, hasServiceUser],
  )

  return (
    <>
      {sections.map((section) => (
        <Panel key={section.key} data-addon-section={section.key}>
          <b>{section.title}</b>
          <ContributionView contribution={section} context={context} />
        </Panel>
      ))}
    </>
  )
}
