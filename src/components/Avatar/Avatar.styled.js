import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

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
export const AvatarIcon = styled(Button)`
    position: absolute;
    top: 75%;
    right: 5%;
    z-index: 999;
    display: inline-block;
    border-radius: 15px;
    padding: 0.3em;
    width: 30px;
    height: 30px;
    background: var(--md-sys-color-surface-container-high);
`
export const Username = styled.span`
    padding: 16px;
    font-size: var(--md-sys-typescale-headline-medium-font-size);
`
export const ImageIcon = styled.span`
    position: relative;
`

