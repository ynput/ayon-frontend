import { Splitter, SplitterPanel } from 'primereact/splitter'
import { ReactNode } from 'react'
import { StyledHeader } from './ProjectUserAccess.styled'

type Props = {
  leftContent: ReactNode
  mainContent: ReactNode
}

const SplitterContainerTwoPanes = ({ leftContent, mainContent }: Props) => {
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

      <SplitterPanel size={100}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <>
          <StyledHeader>&nbsp;</StyledHeader>
          {mainContent}
        </>
      </SplitterPanel>
    </Splitter>
  )
}
export default SplitterContainerTwoPanes
