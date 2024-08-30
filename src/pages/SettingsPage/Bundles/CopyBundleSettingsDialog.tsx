import { useState, useEffect, useMemo } from 'react'
import {
  Button,
  FormLayout,
  FormRow,
  InputSwitch,
  Dialog,
  Dropdown,
} from '@ynput/ayon-react-components'
import BundleDropdown from '@containers/BundleDropdown'
import VariantSelector from '@containers/AddonSettings/VariantSelector'

import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { $Any } from '@types'

type OnConfirmData = {
  markAs: string[]
  copyFrom: boolean
  sourceBundle: string
  sourceVariant: string
}

type DialogBodyProps = {
  onConfirm: (data: OnConfirmData) => void
  onCancel: () => void
  showTargetVariant: boolean
}

const DialogBody = ({ onConfirm, onCancel, showTargetVariant }: DialogBodyProps) => {
  const [markAs, setMarkAs] = useState(['staging'])
  const [copyFrom, setCopyFrom] = useState(true)
  const [sourceBundle, setSourceBundle] = useState('')
  const [sourceVariant, setSourceVariant] = useState('production')

  const copyEnabled = !showTargetVariant || (markAs && copyFrom)
  const { data: { bundles = [] } = {} } = useListBundlesQuery({})

  const currentProductionBundle = useMemo(
    () => bundles?.find((b) => b?.isProduction && !b?.isArchived),
    [bundles],
  )

  useEffect(() => {
    if (!currentProductionBundle) return
    setSourceBundle(currentProductionBundle?.name)
  }, [currentProductionBundle])

  const handleClose = () => {
    onCancel()
  }

  const handleConfirm = () => {
    onConfirm({
      markAs,
      copyFrom: copyFrom || !showTargetVariant,
      sourceBundle,
      sourceVariant,
    })
  }

  const footer = (
    <>
      <Button onClick={handleConfirm} label="Create" icon="check" />
      <Button onClick={handleClose} label="Cancel" icon="close" />
    </>
  )
  return (
    <Dialog
      header="Copy bundle addons settings..."
      footer={footer}
      isOpen
      size="sm"
      onClose={() => handleClose()}
      style={{ width: '600px', height: '300px' }}
    >
      <FormLayout>
        {showTargetVariant && (
          <FormRow label="Set the bundle as">
            <Dropdown
              options={[
                { label: '(nothing)', value: 'nothing' },
                { label: 'Production', value: 'production' },
                { label: 'Staging', value: 'staging' },
              ]}
              value={markAs}
              onChange={(value) => {
                setMarkAs(value)
              }}
            />
          </FormRow>
        )}

        {(markAs || !showTargetVariant) && (
          <>
            {showTargetVariant && (
              <FormRow label="Copy settings">
                <InputSwitch checked={copyFrom} onChange={() => setCopyFrom(!copyFrom)} />
              </FormRow>
            )}

            {copyEnabled && (
              <>
                <FormRow label="Source bundle">
                  <BundleDropdown
                    bundleName={sourceBundle}
                    setBundleName={setSourceBundle}
                    setVariant={setSourceVariant}
                  />
                </FormRow>

                <FormRow label="Source variant">
                  <VariantSelector variant={sourceVariant} setVariant={setSourceVariant} />
                </FormRow>
              </>
            )}
          </>
        )}
      </FormLayout>
    </Dialog>
  )
}

const useNewBundleDialog = () => {
  const [promise, setPromise] = useState<$Any>(null)
  const [showTargetVariant, setShowTargetVariant] = useState(true)

  const newBundlePrompt = (showTargetVariant = true) =>
    // eslint-disable-next-line
    new Promise((resolve) => {
      setShowTargetVariant(showTargetVariant)
      setPromise({ resolve })
    })

  const handleClose = () => {
    promise?.resolve(null)
    setPromise(null)
  }

  const handleConfirm = (data: OnConfirmData) => {
    promise?.resolve(data)
    setPromise(null)
  }

  const NewBundleDialog = () => {
    if (!promise) return
    return (
      <DialogBody
        onConfirm={handleConfirm}
        onCancel={handleClose}
        showTargetVariant={showTargetVariant}
      />
    )
  }

  return [NewBundleDialog, newBundlePrompt]
}

export default useNewBundleDialog
