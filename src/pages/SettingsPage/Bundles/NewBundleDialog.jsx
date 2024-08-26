import React, { useState, } from 'react'
import { Button, FormLayout, FormRow, InputSwitch, Dialog, Dropdown  } from '@ynput/ayon-react-components'
import BundleDropdown from '@containers/BundleDropdown'
import VariantSelector from '@containers/AddonSettings/VariantSelector'

const DialogBody = ({onConfirm, onCancel}) => {

  const [markAs, setMarkAs] = useState(["nothing"])
  const [copyFrom, setCopyFrom] = useState(false)
  const [sourceBundle, setSourceBundle] = useState('')
  const [sourceVariant, setSourceVariant] = useState('')

  const copyEnabled = markAs && copyFrom


  const handleClose = () => {
    onCancel()
  }

  const handleConfirm = () => {
    onConfirm({
      markAs,
      copyFrom,
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
        header="Create a new bundle"
        footer={footer}
        isOpen
        size="sm"
        onClose={() => handleClose()}
        style={{ width: '600px', height: '300px' }}
      >
        <FormLayout>
          <FormRow label="Set the bundle as">
            <Dropdown
              options={[
                { label: '(nothing)', value: 'nothing' },
                { label: 'Production', value: 'production' },
                { label: 'Staging', value: 'staging' },
              ]}
              value={markAs}
              onChange={(value) => {setMarkAs(value)}}
            />
          </FormRow>


          {markAs && (
          <>
            <FormRow label="Copy settings">
              <InputSwitch checked={copyFrom} onChange={() => setCopyFrom(!copyFrom)}/>
            </FormRow>

            {copyEnabled && (
              <>
              <FormRow label="Source bundle">
                  <BundleDropdown bundleName={sourceBundle} setBundleName={setSourceBundle} setVariant={setSourceVariant} />
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
  const [promise, setPromise] = useState(null)

  const newBundlePrompt = () =>
    // eslint-disable-next-line
    new Promise((resolve, reject) => {
      setPromise({ resolve })
    })

  const handleClose = () => {
    promise?.resolve(null)
    setPromise(null)
  }

  const handleConfirm = (data) => {
    promise?.resolve(data)
    setPromise(null)
  }

  const NewBundleDialog = () => {
    if (!promise) return
    return <DialogBody onConfirm={handleConfirm} onCancel={handleClose} />
  }

  return [NewBundleDialog, newBundlePrompt]
}


export default useNewBundleDialog
