// import { useProjectContext } from '@shared/context'
import { Button } from '@ynput/ayon-react-components'
import { FC, useState } from 'react'
import PerProjectBundleDialog from './PerProjectBundleDialog'

interface PerProjectBundleConfigProps {
  projectName: string
  variant: string
}

const PerProjectBundleConfig: FC<PerProjectBundleConfigProps> = ({ projectName, variant }) => {

  // TODO: This does not work. project object is empty for whatever reason.
  // const project = useProjectContext()
  // const bundle = project?.data?.bundle
  // const bundleSetForVariant = variant && bundle?.[variant]
  const bundleSetForVariant = false // Placeholder until project context works


  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button
        icon="deployed_code"
        data-tooltip={`Freeze ${variant} bundle for this project`}
        data-tooltip-delay={0}
        onClick={() => setDialogOpen(!dialogOpen)}
        variant={bundleSetForVariant ? 'filled' : 'surface'}
        disabled={!['production', 'staging'].includes(variant)}
      />
      {dialogOpen && (
        <PerProjectBundleDialog
          projectName={projectName}
          onClose={() => setDialogOpen(false)}
          variant={variant}
        />
      )}
    </>
  )
}

export default PerProjectBundleConfig
