import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'

import LoadingPage from '../loading'

import SiteSyncSummary from './summary'

const SiteSyncPage = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName

  const localSite = 'local'
  const remoteSite = 'remote'

  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [repreNames, setRepreNames] = useState([])

  useEffect(() => {
    setLoading(true)
    const url = `/api/projects/${projectName}/sitesync/params`
    axios
      .get(url)
      .then((response) => {
        let rnames = []
        for (const name of response.data.names) {
          rnames.push({ name: name, value: name })
        }
        setTotalCount(response.data.count)
        setRepreNames(rnames)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [projectName])

  if (loading) return <LoadingPage />

  return (
    <main>
      <SiteSyncSummary
        projectName={projectName}
        localSite={localSite}
        remoteSite={remoteSite}
        names={repreNames}
        totalCount={totalCount}
      />
    </main>
  )
}

export default SiteSyncPage
