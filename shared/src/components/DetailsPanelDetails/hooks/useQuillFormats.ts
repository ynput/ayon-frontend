import { useMemo } from 'react'
import { quillFormats } from '@shared/containers/Feed/components/CommentInput/modules'

interface UseQuillFormatsProps {
  feedContext: any
  projectName?: string
}

export const useQuillFormats = ({ feedContext, projectName }: UseQuillFormatsProps) => {
  // Use conditional formats based on whether mentions are available
  const conditionalFormats = useMemo(() => {
    if (feedContext && projectName) {
      return quillFormats // includes 'mention'
    } else {
      return quillFormats.filter((format) => format !== 'mention')
    }
  }, [feedContext, projectName])

  return conditionalFormats
}
