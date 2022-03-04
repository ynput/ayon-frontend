import { useFetch } from "use-http"
import { useSelector } from "react-redux"

import ProjectWrapper from '../../containers/project-wrapper'
import LoadingPage from '../loading'
import ErrorPage from '../error'

import SiteSyncSummary from './summary'


const SiteSync = () => {
    const context = useSelector(state => ({...state.contextReducer}))
    const projectName = context.projectName

    const localSite = "local"
    const remoteSite = "remote"

    const url = `/api/projects/${projectName}/sitesync/params`
    const {loading, error, data={}} = useFetch(url, [url])

    if (error)
        return <ErrorPage />

    if (loading)
        return <LoadingPage />

    let repreNames = []
    for (const name of data.names)
        repreNames.push({name: name, value: name})

    return (
        <main className="rows">
        <SiteSyncSummary
            projectName={projectName}
            localSite={localSite}
            remoteSite={remoteSite}
            names={repreNames}
            totalCount={data.count}
        />
        </main>
    )
}


const SiteSyncPage = () => {
    return (
        <ProjectWrapper>
            <SiteSync /> 
        </ProjectWrapper>
    )
}


export default SiteSyncPage
