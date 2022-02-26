import { useState, useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import useFetch from "use-http"

import { InputText } from "primereact/inputtext"
import { Column } from "primereact/column"
import { TreeTable } from 'primereact/treetable'
import { MultiSelect } from 'primereact/multiselect'

import { Shade } from '../../components'


const filterHierarchy = (text, folder) => {
    /*
    Filter the hierarchy using a given text and rename "id" to "key"
    and "name" to "label", which is needed to render the hierarchy
    using primereact tree
    */
    let result = []
    if (!folder)
        return []
    for (const item of folder){
        if (item.name && (!text || item.name.toLowerCase().includes(text.toLowerCase()))){
            const newChildren = filterHierarchy(false, item.children)
            result.push({
                key: item.id,
                children: newChildren, 
                data: {
                    name: item.name,
                    type: item.type,
                    subsetCount: item.subsetCount,
                    parents: item.parents
                }
            })
        }
        else if (item.children){
            const newChildren = filterHierarchy(text, item.children)
            if (newChildren.length > 0){
                result.push({
                    key: item.id,
                    children: newChildren,
                    data: {
                        name: item.name,
                        type: item.type,
                        subsetCount: item.subsetCount,
                        parents: item.parents
                    }
                })
            }
        }
    }
    return result
}



const Hierarchy = () => {
    const dispatch = useDispatch()
    const [query, setQuery] = useState('')
    const [selectedFolderTypes, setSelectedFolderTypes] = useState([])

    const context = useSelector(state => ({...state.contextReducer}))
    const projectName = context.projectName
    const folderTypes = context.project.folderTypes

    const [data, setData] = useState([])

    const [request, response, loading] = useFetch(`/api/projects/${projectName}/hierarchy`)
    

    const folderTypeList = useMemo(() => {
        if (!folderTypes)
            return []
        let nlist = []
        for (let folderType in folderTypes){
            nlist.push({
                value: folderType,
                label: folderType,
            })
        }
        return nlist
    }, [folderTypes])

    

    const loadHierarchy = async () => {
        if (projectName){
            let typeCond = ''
            if (selectedFolderTypes)
                typeCond = `?types=${selectedFolderTypes.join(',')}`
            const hdata = await request.get(typeCond)
            if (response.ok){
                setData([...hdata.hierarchy])
            }
        }
    }


    const treeData = useMemo(() => {
        if (!data)
            return []
        return filterHierarchy(query, data)
    }, [data, query])


    useEffect(() => {
        loadHierarchy()
    // Tell the linter to shut up about missing hierarchyRequest dependency,
    // which would cause infinite loop.
    // eslint-disable-next-line
    }, [projectName, selectedFolderTypes])



    const folderSelection = useMemo(() => {
        // TODO: OPTIMIZE!!!!!
        let selection = {}
        for (const folder of context.focusedFolders)
            selection[folder] = true
        return selection
    }, [context.focusedFolders])



    const selectedTypeTemplate = (option) => {
        if (option) {
            const folder_type_label = option ? option.replace(/[a-z]/g, '') : "??"
            return (
                <span 
                    style={{ marginRight : '10px'}}
                >
                    {folder_type_label}</span>
            );
        }
        return "Folder types";
    }



    return (
        <section className="invisible insplit">
            <section className="invisible row">
                <span className="p-input-icon-left" style={{ flexGrow: 1}}>
                    <i className="pi pi-search" />
                    <InputText 
                        style={{ width : '100%'}}
                        placeholder="Filter folders..." 
                        disabled={(!projectName) || loading}
                        value={query} 
                        onChange={(evt) => setQuery(evt.target.value)} 
                    />
                </span>

                <MultiSelect 
                    value={selectedFolderTypes}
                    options={folderTypeList} 
                    placeholder="Select folder types"
                    showClear={true}
                    optionLabel="label"
                    disabled={(!projectName) || loading}
                    selectedItemTemplate={selectedTypeTemplate}
                    onChange={(e) => setSelectedFolderTypes(e.value)}
                    style={{
                        flexBasis: '40%',
                    }}
                />
            </section>

            <section style={{ flexGrow: 1, padding: 0}}>
                {loading && <Shade/> }
                <TreeTable
                    value={treeData}
                    responsive
                    scrollable
                    scrollHeight="100%"
                    selectionMode="multiple"
                    selectionKeys={folderSelection}
                    emptyMessage={loading ? "Loading folders..." : "No folders foud." }

                    onSelectionChange={(e) => {
                        const selection = Object.keys(e.value)
                        dispatch({ type: 'SET_FOCUSED_FOLDERS', objects: selection })
                    }}

                    onRowClick={(e) => {
                        const node = e.node.data
                        dispatch({
                            type: 'SET_BREADCRUMBS',
                            parents: node.parents,
                            folder: node.name
                        })
                    }}
                >
                    <Column 
                        field="name" 
                        header="Hierarchy" 
                        expander={true} 
                        style={{width: '100%'}} 
                    />
                </TreeTable>
            </section>

        </section>
    )

}


export default Hierarchy