// TODO: this is not used anywhere, remove it??

import { useSelector } from 'react-redux'
import { Section } from '@ynput/ayon-react-components'

import AddonUpload from './AddonUpload'

const AddonInstall = () => {
  const user = useSelector((state) => state.user)

  const abortController = new AbortController()
  const handleClose = () => abortController.abort()

  if (!user?.data?.isAdmin) {
    return (
      <Section style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ display: 'block', width: 'auto' }}>Only admins can install addons</p>
      </Section>
    )
  }

  return (
    <Section style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AddonUpload abortController={abortController} onClose={handleClose} />
    </Section>
  )
}

export default AddonInstall
