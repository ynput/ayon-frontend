import { useProjectContext } from '@shared/context'
import { Button } from '@ynput/ayon-react-components'
import { FC, useState } from 'react'
import PerProjectBundleDialog from './PerProjectBundleDialog'

interface PerProjectBundleConfigProps {
  projectName: string
  variant?: string
}

const PerProjectBundleConfig: FC<PerProjectBundleConfigProps> = ({ projectName, variant }) => {
  const project = useProjectContext()
  const bundle = project?.data?.bundle
  const bundleSetForVariant = variant && bundle?.[variant]

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button
        icon="deployed_code"
        data-tooltip="Set a project bundle for this project"
        data-tooltip-delay={0}
        onClick={() => setDialogOpen(!dialogOpen)}
        variant={bundleSetForVariant ? 'filled' : 'surface'}
      />
      {dialogOpen && (
        <PerProjectBundleDialog
          projectName={projectName}
          onClose={() => setDialogOpen(false)}
          init={{
            production: bundle?.production || null,
            staging: bundle?.staging || null,
          }}
        />
      )}
    </>
  )
}

export default PerProjectBundleConfig
