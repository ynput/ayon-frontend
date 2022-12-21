import { useRef, useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Section } from '@ynput/ayon-react-components'
import styled from 'styled-components'

import Hierarchy from '/src/containers/hierarchy'

const AddonWrapper = styled.iframe`
  flex-grow: 1;
  background: 'transparent';
  border: 0;
  overflow: auto;
`

const ProjectAddon = ({ addonName, addonVersion, sidebar }) => {
  const addonRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const context = useSelector((state) => ({ ...state.context }))
  const focusedFolders = context.focused.folders

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

  useEffect(() => {
    if (loading) return
    pushContext()
  }, [focusedFolders])

  const sidebarComponent = useMemo(() => {
    if (sidebar === 'hierarchy') {
      return <Hierarchy style={{ maxWidth: 500, minWidth: 300 }} />
    } else {
      return <></>
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
        <AddonWrapper src={addonUrl} ref={addonRef} onLoad={onAddonLoad} />
      </Section>
    </main>
  )
}

export default ProjectAddon
