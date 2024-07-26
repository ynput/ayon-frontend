import { useRef, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Section } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const AddonWrapper = styled.iframe`
  flex-grow: 1;
  background: 'transparent';
  border: 0;
  overflow: auto;
`

const SettingsAddon = ({ addonName, addonVersion, sidebar }) => {
  const addonRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const context = useSelector((state) => state.context)
  const addonUrl = `${window.location.origin}/addons/${addonName}/${addonVersion}/frontend`

  const pushContext = () => {
    const addonWnd = addonRef.current.contentWindow
    addonWnd.postMessage({
      scope: 'settings',
      accessToken: localStorage.getItem('accessToken'),
      context,
      addonName,
      addonVersion,
    })
  }

  const sidebarComponent = useMemo(() => {
    if (sidebar === 'addonList') {
      return null // TODO
    }
  }, [sidebar])

  const onAddonLoad = () => {
    setLoading(false)
    pushContext()
  }

  return (
    <main>
      {sidebarComponent}
      <Section>
        {loading && <div style={{ display: 'none' }}>Loading...</div>}
        <AddonWrapper src={`${addonUrl}?id=${window.senderId}`} ref={addonRef} onLoad={onAddonLoad} />
      </Section>
    </main>
  )
}

export default SettingsAddon
