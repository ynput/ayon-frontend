import { FC } from 'react'

interface ReviewAddonProps {}

const ReviewAddon: FC<ReviewAddonProps> = ({}) => {
  return <div>BUY NOW FOR A LOW LOW PRICE OF $99.99</div>
}

export default {
  name: 'Review',
  module: 'review',
  component: ReviewAddon,
}
