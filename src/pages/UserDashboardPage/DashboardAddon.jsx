import { useRef, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Section } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import useAddonContextResend from '@hooks/useAddonContextResend'
import LoadingPage from '@pages/LoadingPage'

const AddonWrapper = styled.iframe`
  flex-grow: 1;
  background: 'transparent';
  border: 0;
  overflow: auto;
`

const DashboardAddon = ({ addonName, addonVersion }) => {
  const addonRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const context = useSelector((state) => state.context)
  const addonUrl = `${window.location.origin}/addons/${addonName}/${addonVersion}/frontend`

  //Switching between addons didn't update the loading state which affects the rest of the logic
  useEffect(() => {
    setLoading(true)
  }, [addonUrl])

  const pushContext = () => {
    if (!addonRef.current) {
      return
    }
    const addonWnd = addonRef.current.contentWindow
    addonWnd.postMessage({
      scope: 'dashboard',
      accessToken: localStorage.getItem('accessToken'),
      context,
      addonName,
      addonVersion,
    })
  }

  // Push context to addon whenever explicitly requested
  useAddonContextResend(pushContext)

  const onAddonLoad = () => {
    setLoading(false)
    pushContext()
  }

  useEffect(() => {
    if (addonRef.current) {
      pushContext()
    }
  }, [context])

  return (
    <Section style={{ height: '100%' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <LoadingPage style={{ position: 'absolute' }} />
        </div>
      )}
      <AddonWrapper
        src={`${addonUrl}/?id=${window.senderId}`}
        ref={addonRef}
        onLoad={onAddonLoad}
      />
    </Section>
  )
}

export default DashboardAddon
