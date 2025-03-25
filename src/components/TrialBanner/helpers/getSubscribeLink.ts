const getSubscribeLink = (quantity: number, orgName: string) =>
  `https://ynput.cloud/subscribe/ayon/?org=${orgName}&activeQuantity=${quantity}`

export default getSubscribeLink
