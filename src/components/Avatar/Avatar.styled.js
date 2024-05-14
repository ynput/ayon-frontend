import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

export const Avatar = styled.div`
    position: relative;
    display: flex;
    width: auto;
    
`
export const AvatarIcon = styled(Icon)`
    position: absolute;
    top: 75%;
    right: 5%;
    z-index: 999;
    display: inline-block;
    border-radius: 15px;
    padding: 0.3em;
    background: var(--md-sys-color-surface-container-high);
    :hover {
        cursor: pointer;
        color: var(--md-sys-color-on-surface);
        box-shadow: 0 0 2px var(--md-sys-color-on-surface);
    }
`

