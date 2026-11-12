// the powerpack needs an update to get list values: it is installed but older (current), or the
// production bundle has no ListValues module (current unknown)
export type ListValuesOutdated = { current?: string; required: string }

export const listValuesOutdatedMessage = ({ current, required }: ListValuesOutdated) =>
  current
    ? `Your Power Pack ${current} is outdated. Update to ${required} or newer to use list values.`
    : `Update the Power Pack to ${required} or newer to use list values.`
