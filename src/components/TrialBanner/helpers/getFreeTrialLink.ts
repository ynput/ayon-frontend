const getFreeTrialLink = (instanceId: string) =>
  `https://ynput.cloud/free-trial?instance_id=${instanceId}&redirect_uri=${encodeURIComponent(
    window.location.href,
  )}`

export default getFreeTrialLink
