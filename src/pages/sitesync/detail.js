import { useState } from "react"
import { useFetch } from "use-http"

const SiteSyncDetail = ({projectName, representationId, localSite, remoteSite}) => {


  const baseUrl = `/api/projects/${projectName}/sitesync/state`
    + `&representationId=${representationId}`
    + `&localSite=${localSite}`
    + `&remoteSite=${remoteSite}`

  const [files, setFiles] = useState([])
  const {data, error, loading} = useFetch(baseUrl, [baseUrl])



  return <></>
}

export default SiteSyncDetail
