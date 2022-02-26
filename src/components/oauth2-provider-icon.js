import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { 
    faGoogle,
    faDiscord
} from '@fortawesome/free-brands-svg-icons'


const OAuth2ProviderIcon = ({name}) => {
    const data = {
        "google" : faGoogle,
        "discord" : faDiscord,
    }
    if (name.toLowerCase() in data)
        return <FontAwesomeIcon icon={data[name.toLowerCase()]} className="color-ternary"/>
    return <span>{name}</span>
}

export default OAuth2ProviderIcon 