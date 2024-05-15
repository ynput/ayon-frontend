import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

export const Avatar = styled.div`
    display: flex;
    width: auto;
    align-items: center;
    justify-content: center;
    align-self: center;
    flex-direction: column;
    .user-image {
        border: none;
    }
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
export const Username = styled.span`
    padding: 16px;
    font-size: var(--md-sys-typescale-headline-medium-font-size);
`
export const ImageIcon = styled.span`
    position: relative;
`

