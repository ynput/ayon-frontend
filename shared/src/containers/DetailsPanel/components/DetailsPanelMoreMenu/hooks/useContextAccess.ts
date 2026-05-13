import { useOptionalVersionUploadContext } from '@shared/components'

/**
 * Reads VersionUploadContext without throwing when the provider is absent.
 * Replaces a try/catch around `useVersionUploadContext()` (which violated the
 * Rules of Hooks if the throwing hook was ever to call additional hooks).
 */
export const useContextAccess = () => {
  const versionUploadContext = useOptionalVersionUploadContext()
  return {
    onOpenVersionUpload: versionUploadContext?.onOpenVersionUpload ?? null,
  }
}
