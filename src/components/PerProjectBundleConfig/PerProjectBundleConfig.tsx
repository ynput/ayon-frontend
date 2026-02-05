// import { useProjectContext } from '@shared/context'
import { Button } from '@ynput/ayon-react-components'
import { FC, useState } from 'react'
import PerProjectBundleDialog from './PerProjectBundleDialog'

export const FROZEN_BUNDLE_ICON = 'lock'

export const projectBundleFromName = (name?: string) => {
  if (!name) return null
  const match = name.match(/^__project__(.+)__(\w+)$/)
  if (!match) return null
  return { bundleName: match[1], variant: match[2] }
}
interface PerProjectBundleConfigProps {
  projectName: string
  variant: string
  isPerProjectBundle: boolean
}

const PerProjectBundleConfig: FC<PerProjectBundleConfigProps> = ({
  projectName,
  variant,
  isPerProjectBundle,
}) => {
  // TODO: This does not work. project object is empty for whatever reason.
  // const project = useProjectContext()
  // const bundle = project?.data?.bundle
  // const bundleSetForVariant = variant && bundle?.[variant]
  const bundleSetForVariant = false // Placeholder until project context works

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button
        icon={FROZEN_BUNDLE_ICON}
        data-tooltip={`Freeze ${variant} bundle for this project`}
        data-tooltip-delay={0}
        onClick={() => setDialogOpen(!dialogOpen)}
        variant={bundleSetForVariant ? 'filled' : 'surface'}
        disabled={!['production', 'staging'].includes(variant)}
        selected={isPerProjectBundle}
      />
      {dialogOpen && (
        <PerProjectBundleDialog
          projectName={projectName}
          onClose={() => setDialogOpen(false)}
          variant={variant}
          isFrozen={isPerProjectBundle}
        />
      )}
    </>
  )
}

export default PerProjectBundleConfig
