import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { 
    faFolder,
    faFileVideo,
    faImages,
    faFile,
    faFileArchive,
    faSquare

} from '@fortawesome/free-regular-svg-icons'


const FolderTypeIcon = ({name}) => {
    const data = {
        "folder" : faFolder,
        "shot" : faFileVideo,
        "sequence" : faImages,
        "assetbuild" : faSquare,
        "library" : faFileArchive

    }
    if (name.toLowerCase() in data)
        return <FontAwesomeIcon icon={data[name.toLowerCase()]} className="color-ternary"/>
    return <FontAwesomeIcon icon={faFile} className="color-ternary"/>
}

export default FolderTypeIcon 