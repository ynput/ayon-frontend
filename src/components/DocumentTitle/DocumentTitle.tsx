import { useEffect } from 'react'

type DocumentProps = {
  title: string,
}


const DocumentTitle = ({title}: DocumentProps) => {
  useEffect(() => {
    // Reverse the title parts and join with ·
    const titleParts = title.split(' / ')
    const reversedParts = [...titleParts].reverse()
    const finalTitle = reversedParts.join(' · ')
    
    document.title = finalTitle || 'Ayon'
  }, [title])
  
  return null
}




export default DocumentTitle
