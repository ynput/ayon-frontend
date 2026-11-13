// Who sees a contribution: the user's UI exposure level. The server sets it from the user's role
// (`parse_exposure_level` in ayon-backend); a user can lower their own. It only hides UI: the
// addon's server still checks permissions.

/**
 * AYON's UI exposure levels, the user's `uiExposureLevel` by role. For `minExposureLevel`:
 * `minExposureLevel: EXPOSURE.manager` shows a contribution to managers and admins.
 */
export const EXPOSURE = { guest: 100, user: 500, manager: 700, admin: 900 } as const

/** The lowest and highest `minExposureLevel` a contribution can set. */
export const EXPOSURE_RANGE = { min: 0, max: 1000 } as const

// a page's `access` is the same check
const ACCESS_LEVELS: Readonly<Record<string, number>> = {
  manager: EXPOSURE.manager,
  admin: EXPOSURE.admin,
}

/**
 * The lowest exposure level that sees a contribution: its `minExposureLevel`, and for a page the
 * level of its `access`, whichever is higher. 0 when it sets neither.
 */
export const contributionExposureLevel = (contribution: Readonly<Record<string, unknown>>) => {
  const { minExposureLevel, access } = contribution
  return Math.max(
    typeof minExposureLevel === 'number' ? minExposureLevel : 0,
    typeof access === 'string' ? ACCESS_LEVELS[access] ?? 0 : 0,
  )
}

/**
 * Whether a user at `level` sees the contribution. `undefined`: the user isn't known yet, so only
 * contributions without a level show.
 */
export const isExposed = (contribution: Readonly<Record<string, unknown>>, level: number | undefined) => {
  const required = contributionExposureLevel(contribution)
  return required === 0 || (level !== undefined && level >= required)
}

/** Why a contribution's `minExposureLevel` is invalid, or nothing. */
export const exposureProblem = (contribution: Readonly<Record<string, unknown>>) => {
  const { minExposureLevel: value } = contribution
  if (value === undefined) return
  if (!Number.isInteger(value) || (value as number) < EXPOSURE_RANGE.min || (value as number) > EXPOSURE_RANGE.max) {
    return `minExposureLevel must be a whole number from ${EXPOSURE_RANGE.min} to ${EXPOSURE_RANGE.max}, e.g. EXPOSURE.manager (${EXPOSURE.manager})`
  }
}
