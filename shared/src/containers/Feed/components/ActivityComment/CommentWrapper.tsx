import React, { FC, ReactElement } from 'react'

const removeAts = (text: string): string => {
  // remove @ if followed by @ or [
  return text.replace(/@(?=@|\[)/g, '')
}

const CommentWrapper: FC<{ children: React.ReactNode }> = ({ children }) => {
  const parsedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child

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
