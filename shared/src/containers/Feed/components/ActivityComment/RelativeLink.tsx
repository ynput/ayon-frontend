import { MouseEvent, ReactNode, useContext } from 'react'
import { DetailsPanelContext } from '@shared/context/details-panel/DetailsPanelContextInstance'
import type { DetailsPanelContextType } from '@shared/context/details-panel/DetailsPanelContext'

interface RelativeLinkProps {
  to: string
  children?: ReactNode
}

interface RouterLinkProps extends RelativeLinkProps {
  useNavigate: DetailsPanelContextType['useNavigate']
}

const RouterLink = ({ to, useNavigate, children }: RouterLinkProps) => {
  const navigate = useNavigate()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // the browser handles opening in a new tab or window
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} onClick={handleClick}>
      {children}
    </a>
  )
}

// A link to a page on this server.
// Not react-router's <Link>: an addon bundles its own react-router, which has no router above it,
// so <Link> throws there. The host's router hooks come through the details panel context.
const RelativeLink = ({ to, children }: RelativeLinkProps) => {
  const useNavigate = useContext(DetailsPanelContext)?.useNavigate
  if (!useNavigate) return <a href={to}>{children}</a>

  return (
    <RouterLink to={to} useNavigate={useNavigate}>
      {children}
    </RouterLink>
  )
}

export default RelativeLink
