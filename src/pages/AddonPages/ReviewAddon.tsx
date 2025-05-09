import { FC } from 'react'

interface ReviewAddonProps {}

const ReviewAddon: FC<ReviewAddonProps> = ({}) => {
  return <div>Review addon coming soon...</div>
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
