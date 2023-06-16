import AddonUpload from './AddonUpload'

import { Section } from '@ynput/ayon-react-components'

const AddonInstall = () => {
  return (
    <Section style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AddonUpload />
    </Section>
  )
}

export default AddonInstall
