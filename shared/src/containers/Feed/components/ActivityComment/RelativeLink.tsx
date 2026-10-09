import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface RelativeLinkProps {
  to: string
  children?: ReactNode
}

// a link to a page on this server
const RelativeLink = ({ to, children }: RelativeLinkProps) => <Link to={to}>{children}</Link>

export default RelativeLink
