import { FC } from 'react'

interface ReviewAddonProps {}

const ReviewAddon: FC<ReviewAddonProps> = ({}) => {
  return <div>BUY NOW FOR A LOW LOW PRICE OF $99.99</div>
}

export default {
  id: 'review',
  component: ReviewAddon,
  data: {
    name: 'Review',
    module: 'reviews',
    path: '/projects/:projectName/reviews/:sessionId',
  },
}
