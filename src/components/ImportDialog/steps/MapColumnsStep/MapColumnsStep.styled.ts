import styled from "styled-components"

// what are you doing, step-container?
export const StepContainer = styled.div`
  display: flex;
  flex-flow: column;
  height: 100%;
  overflow: hidden;
`

export const Container = styled.div`
  display: grid;
  grid-template-columns: minmax(66%, max-content) 1fr;
  gap:var(--base-gap-medium);
  height: 100%;
  overflow: hidden;
`

export const Preview = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  position: relative;
`

export const PreviewHeading = styled.h2`
  background: var(--md-sys-color-surface-container);
  padding: var(--padding-m) 0 var(--padding-m) var(--padding-m);
  margin: 0;
  font-size: inherit;
  position: sticky;
  top: 0;
  z-index: 1;
  line-height: 20px;
  display: flex;
  gap: var(--base-gap-small);
  justify-content: space-between;
  align-items: center;
`
