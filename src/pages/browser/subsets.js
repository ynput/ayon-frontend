import { useState, useEffect } from "react"
import { useFetch } from "use-http"
import { useSelector, useDispatch } from "react-redux"
import { DateTime } from "luxon"

import { InputText, Spacer, Button, Shade } from "../../components"
import { DataTable } from 'primereact/datatable'
import { Column } from "primereact/column"

const QUERY = `
query Subsets($projectName: String!, $folders: [String!]!){
    project(name: $projectName){
        subsets(folderIds: $folders){
            edges {
                node {
                    id
                    name
                    family
                    createdAt
                    latestVersion{
                        id
                        version
                        name
                        author
                        createdAt
                        attrib {
                            fps
                            resolutionWidth
                            resolutionHeight
                            frameStart
                            frameEnd
                        }
                    }
                    folder {
                        id
                        name
                        parents
                        attrib {
                            fps
                            resolutionWidth
                            resolutionHeight
                            frameStart
                            frameEnd
                        }
                    }
                }
            }
        }
    }
}
`


const parseSubsetFps = (subset) => {
    const folderFps = subset.folder.attrib.fps || ""
    if (!subset)
        return folderFps
    if (!subset.latestVersion)
        return folderFps
    if (!subset.latestVersion.attrib)
        return folderFps
    return subset.latestVersion.attrib.fps || ""
}

const parseSubsetResolution = (subset) => {
    /* 
    Return the resolution of the latest version of the given subset, 
    or resolution of the folder if the version has no resolution 
    */
    const folderWidth = subset.folder.attrib.resolutionWidth || null
    const folderHeight = subset.folder.attrib.resolutionHeight || null
    const folderResolution = (folderWidth && folderHeight) ? `${folderWidth}x${folderHeight}` : ""

    if (!subset)
        return folderResolution
    if (!subset.latestVersion)
        return folderResolution
    if (!subset.latestVersion.attrib)
        return folderResolution

    const width = subset.latestVersion.attrib.resolutionWidth || null
    const height = subset.latestVersion.attrib.resolutionHeight || null
    const resolution = (width && height) ? `${width}x${height}` : ""
    return resolution || folderResolution
}

const parseSubsetFrames = (subset) => {

    const folderStart = subset.folder.attrib.frameStart || null
    const folderEnd = subset.folder.attrib.frameEnd || null
    const folderFrames = (folderStart && folderEnd) ? `${folderStart}-${folderEnd}` : ""

    if (!subset)
        return ""
    if (!subset.latestVersion)
        return ""
    if (!subset.latestVersion.attrib)
        return ""
    const frameStart = subset.latestVersion.attrib.frameStart || ""
    const frameEnd = subset.latestVersion.attrib.frameEnd || ""
    const frames = (frameStart && frameEnd) ? `${frameStart}-${frameEnd}` : ""
    return frames || folderFrames
}



const Subsets = () => {
    const dispatch = useDispatch()
    const context = useSelector(state =>({...state.contextReducer}))
    const folders = context.focusedFolders
    const projectName = context.projectName

    const request = useFetch('/graphql')
    const [subsetData, setSubsetData] = useState([])
    const [selection, setSelection] = useState([])

    useEffect (() => {
        // useEffect and useState is used here, because of the async function
        // useMemo returns a promise, which we don't want
        async function fetchSubsets() {
            if (folders.length === 0)
                return []
        
            const data = await request.query(QUERY, {folders, projectName}) 
            if (!data.data.project){
                return []
            }

            if (!data.data.project)
                return [] // no such project
            let s = []
            for (let subsetEdge of data.data.project.subsets.edges) {
                let subset = subsetEdge.node
                let vers = subset.latestVersion || null
                let sub = {
                    id: subset.id,
                    name: subset.name,
                    family: subset.family,
                    fps: parseSubsetFps(subset),
                    resolution: parseSubsetResolution(subset),
                    folder: subset.folder.name,
                    author: vers ? vers.author : null,
                    parents: subset.folder.parents,
                    version: vers ? vers.version : null,
                    versionId: (vers && vers.id) ? vers.id : null,
                    versionName: (vers && vers.name) ? vers.name : "",
                    frames: parseSubsetFrames(subset),
                    createdAt: vers ? vers.createdAt : subset.createdAt,
                }
                s.push(sub)
            }
            setSubsetData(s)
        }
        fetchSubsets()
    // eslint-disable-next-line
    }, [folders, projectName])


    useEffect(() => {

        setSelection([...subsetData.filter(s => context.focusedVersions.includes(s.versionId))])

    }, [subsetData, context.focusedVersions])


    return (
        <section className="invisible insplit">

            <section className="invisible row">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText 
                        style={{ width : '200px'}}
                        placeholder="Filter subsets..." 
                        disabled={true}
                    />
                </span>
                <Button icon="pi pi-list" tooltip="Mockup button" disabled={true} tooltipOptions={{position:"bottom"}}/>
                <Button icon="pi pi-th-large" tooltip="Mockup button" disabled={true} tooltipOptions={{position:"bottom"}}/>
                <Spacer/>
                <Button icon="pi pi-lock" tooltip="Mockup button" disabled={true} tooltipOptions={{position:"bottom"}}/>
                <Button icon="pi pi-sitemap" tooltip="Mockup button" disabled={true} tooltipOptions={{position:"bottom"}}/>
                <Button icon="pi pi-star" tooltip="Mockup button" disabled={true} tooltipOptions={{position:"bottom"}}/>
                <Button icon="pi pi-cog" tooltip="Mockup button" disabled={true} tooltipOptions={{position:"bottom"}}/>
            </section>
        
            <section style={{
                flexGrow: 1,
                padding: 0
            }}>

                <div className="wrapper"> 
                {request.loading && <Shade/>}
                <DataTable 
                    value={subsetData} 
                    scrollable
                    responsive
                    resizableColumns
                    columnResizeMode="expand"
                    scrollDirection="both"
                    scrollHeight="flex"
                    responsiveLayout="scroll"
                    emptyMessage="No subset found"
                    selectionMode="multiple" 
                    selection={selection}
                    onSelectionChange={(e) => {
                        let selection = []
                        for (let elm of e.value) {
                            if (elm.versionId)
                                selection.push(elm.versionId)
                        }
                        dispatch({type: "SET_FOCUSED_VERSIONS", objects: selection})
                    }}
                    onRowClick={(e) => {
                        dispatch({
                            type: 'SET_BREADCRUMBS',
                            parents: e.data.parents,
                            folder: e.data.folder,
                            subset: e.data.name,
                            version: e.data.versionName
                        })
                    }}
                >
                    <Column field="name" header="Subset" style={{width: 200}} />
                    <Column field="folder" header="Folder" style={{width: 200}}/>
                    <Column field="family" header="Family" style={{width: 120}}/>
                    <Column field="versionName" header="Version" style={{ width: 70}}/>
                    <Column field="time" header="Time" style={{width: 150}} body={rowdata=> DateTime.fromSeconds(rowdata.createdAt).toRelative() } />
                    <Column field="author" header="Author" style={{width: 120}}/>
                    <Column field="frames" header="Frames" style={{width: 120}}/>
                </DataTable>
                </div>


            </section>
        </section>
    )
}

export default Subsets
