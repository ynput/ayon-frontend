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

const ProjectAddon = ({ addonName, addonVersion, sidebar }) => {
  const addonRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const context = useSelector((state) => state.context)
  const addonUrl = `${window.location.origin}/addons/${addonName}/${addonVersion}/frontend/`

  const pushContext = () => {
    const addonWnd = addonRef.current.contentWindow
    addonWnd.postMessage({
      scope: 'project',
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

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <main>
      {sidebarComponent}
      <Section>
        <AddonWrapper src={addonUrl} ref={addonRef} onLoad={onAddonLoad} />
      </Section>
    </main>
  )
}

export default ProjectAddon
