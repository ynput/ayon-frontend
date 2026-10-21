// the powerpack is installed, but older than the ListValues module needs
export type ListValuesOutdated = { current: string; required: string }

export const listValuesOutdatedMessage = ({ current, required }: ListValuesOutdated) =>
  `Your Power Pack ${current} is outdated. Update to ${required} or newer to use list values.`
