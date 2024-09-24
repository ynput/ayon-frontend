const getSubscribeLink = (instanceId: string, quantity: number) =>
  `https://ynput.cloud/subscribe/ayon/?instance=${instanceId}&quantity=${quantity}`

export default getSubscribeLink
