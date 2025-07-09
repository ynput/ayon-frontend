import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useFeedback } from '@shared/components'

const normalizePath = (path: string) =>
  path.replace(/\/+$/, '').split('?')[0].toLowerCase()

export const useHelpButtonHandler = (pages: { path: string; name?: string; articleId?: string }[]) => {
  const location = useLocation()
  const { openPortal, openSupport } = useFeedback()

  const currentPage = useMemo(() => {
    return pages.find((page) => normalizePath(page.path) === normalizePath(location.pathname))
  }, [location.pathname, pages])

  const handleHelpClick = () => {
    if (currentPage?.articleId) {
      openPortal('HelpView', currentPage.articleId)
    } else {
      openSupport(
        'NewMessage',
        `Can you help me know more about the Project ${currentPage?.name} page?`,
      )
    }
  }

  return { handleHelpClick }
}
