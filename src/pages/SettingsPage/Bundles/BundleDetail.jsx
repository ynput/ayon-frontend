import { useState, useEffect } from 'react'
// import { toast } from 'react-toastify'
import { Section, Toolbar, Spacer, Button } from '@ynput/ayon-react-components'
import * as Styled from './Bundles.styled'
import BundleForm from './BundleForm'
import BundleDeps from './BundleDeps'
import { upperFirst } from 'lodash'

const BundleDetail = ({ bundle, onDuplicate, installers, toggleBundleStatus }) => {
  const [formData, setFormData] = useState({})
  const [selectedAddons, setSelectedAddons] = useState([])

  const bundleStates = [
    {
      name: 'staging',
      active: bundle?.isStaging,
    },
    {
      name: 'production',
      active: bundle?.isProduction,
    },
  ]

  // every time we select a new bundle, update the form data
  useEffect(() => {
    if (bundle) {
      setFormData(bundle)
    }
  }, [bundle])

  return (
    <Section>
      <Toolbar>
        <Spacer />
        <>
          {bundleStates.map(({ name, active }) => (
            <Styled.BadgeButton
              key={name}
              $hl={active ? name : null}
              icon={active && 'cancel'}
              onClick={() => toggleBundleStatus(name)}
            >
              {!active ? 'Set' : 'Unset'} {upperFirst(name)}
            </Styled.BadgeButton>
          ))}
        </>
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
