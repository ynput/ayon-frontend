import ActivityCommentOrigin from './ActivityCommentOrigin/ActivityCommentOrigin'
import ActivityCommentRef from './ActivityCommentRef/ActivityCommentRef'

const index = (props) => {
  if (props.activity.referenceType === 'origin') {
    return <ActivityCommentOrigin {...props} />
  } else {
    return <ActivityCommentRef {...props} />
  }
}

export default index
