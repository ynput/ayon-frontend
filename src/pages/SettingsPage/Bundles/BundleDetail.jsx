import { useState, useEffect } from 'react'
// import { toast } from 'react-toastify'
import { Section, Toolbar, Spacer, FormLayout, FormRow, Button } from '@ynput/ayon-react-components'

import BundleForm from './BundleForm'

const BundleDetail = ({ bundle, onDuplicate }) => {
  // const { data: addons, loading } = useGetAddonListQuery({ showVersions: true })

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
      <BundleForm isNew={false} {...{ selectedAddons, setSelectedAddons, formData, setFormData }}>
        <section style={{ flexGrow: 1 }}>
          <h2>Dependency packages</h2>
          {bundle && (
            <FormLayout>
              <FormRow label="Windows">{bundle.dependencyPackages?.windows || '(NONE)'}</FormRow>
              <FormRow label="Linux">{bundle.dependencyPackages?.linux || '(NONE)'}</FormRow>
              <FormRow label="MacOS">{bundle.dependencyPackages?.darwin || '(NONE)'}</FormRow>
            </FormLayout>
          )}
        </section>
      </BundleForm>
    </Section>
  )
}

export default BundleDetail
