import React from 'react'

const removeAts = (text) => {
  // remove @ if followed by @ or [
  return text.replace(/@(?=@|\[)/g, '')
}

const CommentWrapper = ({ children }) => {
  const parsedChildren = React.Children.map(children, (child) => {
    const bodyString = child.props.children

    if (typeof bodyString !== 'string') return child
    else {
      const newChild = {
        ...child,
        props: {
          ...child.props,
          children: removeAts(bodyString),
        },
      }

      return newChild
    }
  })

  return parsedChildren
}

export default CommentWrapper
