import { useEffect, useState, useMemo } from 'react'
import { useFetch } from 'use-http'
import { useSelector } from 'react-redux'

import { DataTable } from "primereact/datatable"
import { Dialog } from "primereact/dialog"
import { Column } from "primereact/column"
import { Button, Spacer } from  "../../components"


const FILES_QUERY = `
query Files($projectName: String!, $representationId: String!) {
    project(name: $projectName) {
        representation(id: $representationId, localSite:"local", remoteSite:"remote") {
            files {
                baseName
                localState {
                    status
                }
                remoteState {
                    status
                }

            }
        }
    }
}

`

const StateDialog = ({projectName, representationId, onHide}) => {
    const [request, response] = useFetch('/graphql')
    
    useEffect(() => {
        request.query(FILES_QUERY, {projectName, representationId})
        // eslint-disable-next-line
    }, [])

    const files = useMemo(() => {
        if (!(response.data && response.data.data))
            return []
        
        const data = response.data.data
    
        if (data.project && data.project.representation && data.project.representation.files) {
            let result = []
            for (const file of data.project.representation.files){
                result.push({
                    baseName: file.baseName,
                    localStatus: file.localState.status,
                    remoteStatus: file.remoteState.status
                })
            }
            return result
        }
        else
            return []
    }, [response.data])


    return (
        <Dialog onHide={onHide} visible style={{minHeight: "40%", minWidth: "40%"}}>
            <DataTable
                value={files}
                responsive
                resizableColumns
                columnResizeMode="expand"
                emptyMessage="No file found"
                selectionMode="multiple" 
            >
                <Column field="baseName" header="Name" style={{ width: 60}}/>
                <Column field="localStatus" header="Local" style={{ width: 70}} />
                <Column field="remoteStatus" header="Remote" style={{ width: 70}}/>
            </DataTable>
        </Dialog>
    )

}


const Representations = ({representations}) => {
    const [stateDialogId, setStateDialogId] = useState(null)
    const context = useSelector(state => ({...state.contextReducer}))
    const projectName = context.projectName

    return (<>

        <section className="invisible row" >
            <span className="section-header">Representations</span>
            <Spacer/>
            <Button icon="pi pi-bolt" disabled={true} tooltip="Mockup button"/>
        </section>
        <section style={{ flexGrow: 1}}>
            <div className="wrapper"> 
            <DataTable 
                value={representations}

                scrollable
                responsive
                resizableColumns
                columnResizeMode="expand"
                scrollDirection="both"
                scrollHeight="flex"
                responsiveLayout="scroll"
                emptyMessage="No representation found"
                selectionMode="multiple" 

                onRowClick={(e) => {
                    setStateDialogId(e.data.id)
                }}

            >
                <Column field="name" header="Name" style={{ width: 60}}/>
                <Column field="folderName" header="Folder" style={{ width: 120}} />
                <Column field="subsetName" header="Subset" style={{ width: 120}}/>
                <Column field="family" header="Family" style={{ width: 120}} />
                <Column field="fileCount" header="Files" style={{ width: 70}} />
                <Column field="localStatus" header="Local" style={{ width: 70}} />
                <Column field="remoteStatus" header="Remote" style={{ width: 70}}/>
            </DataTable>
            </div>
        </section>
            
        { stateDialogId && <StateDialog projectName={projectName} representationId={stateDialogId} onHide={()=>{setStateDialogId(null)}}/>}

    </>)
}

export default Representations
