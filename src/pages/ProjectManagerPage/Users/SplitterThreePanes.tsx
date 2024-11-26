import { Splitter, SplitterPanel } from 'primereact/splitter'
import { ReactNode } from 'react'
import styled from 'styled-components'

const RightPanelWrapper = styled.div`
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`

type Props = {
  leftContent: ReactNode
  mainContent: ReactNode
  rightContent: ReactNode
}

const SplitterContainerThreePanes = ({ leftContent, mainContent, rightContent }: Props) => {
  return (
    <Splitter layout="horizontal" style={{ height: '100%', overflow: 'hidden' }}>
      <SplitterPanel
        className="flex align-items-center justify-content-center"
        size={25}
        minSize={10}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {leftContent}
      </SplitterPanel>

      <SplitterPanel size={50} style={{ display: 'flex', flexDirection: 'column' }}>
        {mainContent}
      </SplitterPanel>

      <SplitterPanel
        size={30}
        style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <RightPanelWrapper>{rightContent}</RightPanelWrapper>
      </SplitterPanel>
    </Splitter>
  )
}
export default SplitterContainerThreePanes
