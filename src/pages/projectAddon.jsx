import { useRef } from 'react'
import { useSelector } from 'react-redux'

const ProjectAddon = ({addon_name, version}) => {
  const addonRef = useRef(null)
  const context = useSelector((state) => ({ ...state.context }))

  //  const addonUrl = `/addons/${addon_name}/${version}`;
  const addonUrl = `/addons/test/1.0.0`;

  const onLoad = () => {
    const addonWnd = addonRef.current.contentWindow
    addonWnd.postMessage({
      type: 'init',
      data: context
    })
  }

  return (
    <main className="rows">
      <iframe
        className="embed"
        title="apidoc"
        src={addonUrl}
        ref={addonRef}
        onLoad={onLoad}
        style={{ flexGrow: 1, background: "transparent" }}
      />
    </main>
  )
}

export default ProjectAddon
