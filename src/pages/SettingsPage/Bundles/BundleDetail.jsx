import { useState, useEffect } from 'react'
// import { toast } from 'react-toastify'
import { Section, Toolbar, Spacer, Button } from '@ynput/ayon-react-components'

import BundleForm from './BundleForm'
import BundleDeps from './BundleDeps'

const BundleDetail = ({ bundle, onDuplicate, installers }) => {
  const [formData, setFormData] = useState({})
  const [selectedAddons, setSelectedAddons] = useState([])

  // every time we select a new bundle, update the form data
  useEffect(() => {
    if (bundle) {
      setFormData(bundle)
    }
  }, [bundle])

  return (
    <Section style={{ overflow: 'hidden' }}>
      <Toolbar>
        <Spacer />
        <Button
          label="Duplicate and Edit"
          icon="edit_document"
          onClick={() => onDuplicate(bundle.name)}
        />
      </Toolbar>
      <BundleForm
        isNew={false}
        {...{ selectedAddons, setSelectedAddons, formData, setFormData, installers }}
      >
        <BundleDeps bundle={bundle} />
      </BundleForm>
    </Section>
  )
}

export default BundleDetail
