import styled, { css } from 'styled-components'

export const NavBar = styled.nav`
    display: flex;
    align-items: center;
    gap: var(--base-gap-small);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--panel-background);
    padding: 0 8px;
`

const list = css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--base-gap-small);
    /* reset defaults */
    list-style: none;
    margin: 0;
    padding: 0;
`

export const TabsScroller = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
`

export const TAB_FADE_PX = 32
const FADE = `${TAB_FADE_PX}px`

export const Tabs = styled.ul`
    ${list}
    min-width: 0;

    /* this hides the border of the navbar by putting the active tab border over it */
    position: relative;
    top: 1px;
    margin-bottom: -1px;

    overflow-x: auto;
    /* hide scroll bar */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
        display: none;
    }

    &[data-fade-start='true'] {
        mask-image: linear-gradient(to right, transparent, black ${FADE});
    }
    &[data-fade-end='true'] {
        mask-image: linear-gradient(to left, transparent, black ${FADE});
    }
    &[data-fade-start='true'][data-fade-end='true'] {
        mask-image: linear-gradient(
            to right,
            transparent,
            black ${FADE},
            black calc(100% - ${FADE}),
            transparent
        );
    }
`

export const Trailing = styled.ul`
    ${list}
    flex-shrink: 0;
`

export const NavItem = styled.li`
    user-select: none;
    /* NavLink */
    a {
        padding: 2px 4px;
        padding-bottom: 4px;
        display: block;
        border: 1px solid transparent;
        border-radius: 4px 4px 0 0;

        /* this will be fixed with theme buttons */
        button {
            padding: 4px 16px;
            max-height: unset;
        }

        &.active {
            background-color: var(--md-sys-color-background);
            border: 1px solid var(--md-sys-color-outline-variant);
            border-bottom: 1px solid var(--color-grey-01);

            button {
                &:hover {
                    background-color: unset;
                }
            }

            border-bottom: 1px solid var(--md-sys-color-background);
        }
    }
`

export const Views = styled.span`
    display: flex;
    align-items: center;
    margin-left: -8px;
`
