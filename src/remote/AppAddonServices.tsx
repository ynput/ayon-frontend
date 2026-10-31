import { useAppSelector } from '@state/store'
import { useAfterStartup } from '@shared/hooks'
import { AddonServices } from '@shared/components/AddonLayout/AddonServices'

// Addon services (app.service slot, @ynput/ayon-addon), mounted once next to the header: they
// keep running from page to page. Not for guests, who don't get the addons' header items either.
// They mount after startup, so their bundles don't compete with the page's own requests.
const AppAddonServices = () => {
  const isGuest = useAppSelector((state) => state.user.data.isGuest)
  const projectName =
    (useAppSelector((state) => state.project.openProject) as string | null) || null
  const isAfterStartup = useAfterStartup()
  if (isGuest || !isAfterStartup) return null
  return <AddonServices projectName={projectName} />
}

export default AppAddonServices
