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
    bottom: 0;
    right: 0;
    z-index: 1;
    display: inline-block;
    border-radius: 15px;
    padding: 0.3em;
    width: 30px;
    height: 30px;
    background: var(--md-sys-color-surface-container-high);
`
export const ImageIcon = styled.span`
    position: relative;
`

