import { quillFormats } from '@shared/containers/Feed/components/CommentInput/modules'

export const useQuillFormats = () => {
  // Remove mention format since mentions are disabled
  return quillFormats.filter((format) => format !== 'mention')
}
