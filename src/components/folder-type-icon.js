import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  faFolder,
  faFileVideo,
  faImages,
  faFileArchive,
  faSquare,
} from '@fortawesome/free-regular-svg-icons'

const FolderTypeIcon = ({ name }) => {
  if (!name)
    return <FontAwesomeIcon icon={faFolder} className="color-ternary" />

  const data = {
    shot: faFileVideo,
    sequence: faImages,
    assetbuild: faSquare,
    asset: faSquare,
    library: faFileArchive,
    episode: faFileVideo,
  }
  if (name.toLowerCase() in data)
    return (
      <FontAwesomeIcon
        icon={data[name.toLowerCase()]}
        className="color-ternary"
      />
    )
  console.log("No icon for", name)
  return <FontAwesomeIcon icon={faFolder} className="color-ternary" />
}

export default FolderTypeIcon
