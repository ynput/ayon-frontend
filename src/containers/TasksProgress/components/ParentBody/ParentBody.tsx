import { FC } from 'react'
import { Body } from '../FolderBody/FolderBody.styled'

interface ParentBodyProps {
  name: string
}

const ParentBody: FC<ParentBodyProps> = ({ name }) => {
  return (
    <Body>
      <span className="title">{name}</span>
    </Body>
  )
}

export default ParentBody
