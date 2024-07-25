import { FC } from 'react'
import * as Styled from './DetailsPanelToolbar.styled'
import EntityPath from '@components/EntityPath'
import { PathSegment } from '@components/EntityPath/EntityPath'
import { Button } from '@ynput/ayon-react-components'
import useDetailsPanelTools from './useDetailsPanelTools'
import Shortcuts from '@containers/Shortcuts'

interface DetailsPanelToolbarProps {
  projectName: string
  segments: PathSegment[]
  onClose: () => void
}

const DetailsPanelToolbar: FC<DetailsPanelToolbarProps> = ({ projectName, segments, onClose }) => {
  const { tools, shortcuts } = useDetailsPanelTools({ onClose })

  return (
    <>
      <Shortcuts shortcuts={shortcuts} deps={[]} />
      <Styled.Toolbar>
        <EntityPath
          {...{
            projectName,
            segments,
          }}
        />
        <Styled.Buttons>
          {tools.map((tool, index) => (
            <Button key={index} variant="text" {...tool} />
          ))}
        </Styled.Buttons>
      </Styled.Toolbar>
    </>
  )
}

export default DetailsPanelToolbar
