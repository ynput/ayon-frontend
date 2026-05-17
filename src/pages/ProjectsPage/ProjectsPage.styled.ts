import styled from 'styled-components'

export const PageContainer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`
export const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }
`
