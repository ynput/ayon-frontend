import Review from '@/containers/Review'
import { FC } from 'react'

interface ReviewPageProps {}

const ReviewPage: FC<ReviewPageProps> = () => {
  return (
    <main>
      <Review />
    </main>
  )
}

export default ReviewPage
