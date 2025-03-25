import { FC } from 'react'
import { PathSegment } from '../EntityPath'

interface VersionsPathSelectProps {
  versions: PathSegment[]
}

const VersionsPathSelect: FC<VersionsPathSelectProps> = ({ versions }) => {
  return <div>VersionsPathSelect</div>
}

export default VersionsPathSelect
