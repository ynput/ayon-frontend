import { useRef, useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Section } from '/src/components'

import Hierarchy from './browser/hierarchy'

const ProjectAddon = ({ addonName, addonVersion, sidebar }) => {
  const addonRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folderTypes = context.project.folderTypes
  const expandedFolders = context.expandedFolders
  const focusedFolders = context.focusedFolders

  const addonUrl = `/addons/${addonName}/${addonVersion}/frontend/`

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
      return (
        <Hierarchy
          projectName={projectName}
          folderTypes={folderTypes}
          focusedFolders={focusedFolders}
          expandedFolders={expandedFolders}
        />
      )
    } else {
      return <></>
    }
  }, [sidebar, projectName, folderTypes, focusedFolders, context])

  return (
    <main>
      {sidebarComponent}

      <Section>
        <iframe
          className="embed"
          title="apidoc"
          src={addonUrl}
          ref={addonRef}
          onLoad={() => {
            setLoading(false)
            pushContext()
          }}
          style={{ flexGrow: 1, background: 'transparent' }}
        />
      </Section>
    </main>
  )
}

export default ProjectAddon
