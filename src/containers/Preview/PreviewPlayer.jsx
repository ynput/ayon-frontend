import { PreviewPlayerWrapper } from './Preview.styled'

const PreviewPlayer = ({ selected }) => {
  return (
    <PreviewPlayerWrapper>
      <h2>Selected Version: {selected.join(', ')}</h2>
    </PreviewPlayerWrapper>
  )
}

export default PreviewPlayer
