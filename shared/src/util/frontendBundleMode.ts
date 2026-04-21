import type { UserModel } from '@shared/api'

export type FrontendBundleMode = 'production' | 'staging' | 'developer'

type UserLike = Pick<UserModel, 'attrib' | 'data'> | null | undefined

const FRONTEND_BUNDLE_MODES: FrontendBundleMode[] = ['production', 'staging', 'developer']

export const isFrontendBundleMode = (value: unknown): value is FrontendBundleMode =>
  typeof value === 'string' && FRONTEND_BUNDLE_MODES.includes(value as FrontendBundleMode)

export const getFrontendBundleMode = (user?: UserLike): FrontendBundleMode => {
  const preferredMode = user?.data?.frontendPreferences?.frontendBundleMode
  const isDeveloper = !!user?.data?.isDeveloper

  if (preferredMode === 'developer') {
    return isDeveloper ? 'developer' : 'production'
  }

  if (preferredMode === 'staging') {
    return 'staging'
  }

  if (isFrontendBundleMode(preferredMode)) {
    return preferredMode
  }

  return 'production'
}

export const getFrontendBundleVariant = (
  mode: FrontendBundleMode,
): 'production' | 'staging' | undefined => {
  if (mode === 'developer') {
    return undefined
  }

  return mode
}

export const getFrontendBundleModeLabel = (mode: FrontendBundleMode) => {
  switch (mode) {
    case 'staging':
      return 'staging bundle'
    case 'developer':
      return 'developer bundle'
    default:
      return 'production bundle'
  }
}
