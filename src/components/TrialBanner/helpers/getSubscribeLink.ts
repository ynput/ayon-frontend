const getSubscribeLink = (quantity: number, instanceId: string) =>
  `https://ynput.cloud/instances/${instanceId}/subscribe?seats=${quantity}`

export default getSubscribeLink
