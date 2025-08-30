// Utility function to dynamically load CSS for remote modules
export const loadRemoteCSS = async (addonName: string, addonVersion: string, remoteName: string) => {
  const cssId = `css-${addonName}-${remoteName}`
  
  // Check if CSS is already loaded
  if (document.getElementById(cssId)) {
    return
  }

  try {
    // Fetch the HTML file of the remote module to get the CSS link
    const htmlUrl = `/addons/${addonName}/${addonVersion}/frontend/modules/${remoteName}/index.html`
    console.log('loadRemoteCSS', htmlUrl)
    const response = await fetch(htmlUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract CSS link from the HTML
    const cssLinkMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"[^>]*>/)
    
    if (cssLinkMatch && cssLinkMatch[1]) {
      const cssHref = cssLinkMatch[1]
      
      // Create link element for CSS
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.crossOrigin = 'anonymous'
      
      // If the CSS href is relative, make it absolute
      if (cssHref.startsWith('./')) {
        link.href = `/addons/${addonName}/${addonVersion}/frontend/modules/${remoteName}/${cssHref.substring(2)}`
      } else if (cssHref.startsWith('/')) {
        link.href = cssHref
      } else {
        link.href = `/addons/${addonName}/${addonVersion}/frontend/modules/${remoteName}/${cssHref}`
      }
      
      // Add to head
      document.head.appendChild(link)
      
      console.log(`Loaded CSS for ${addonName}/${remoteName}:`, link.href)
    } else {
      console.warn(`No CSS link found in HTML for ${addonName}/${remoteName}`)
    }
  } catch (error) {
    console.warn(`Failed to load CSS for ${addonName}/${remoteName}:`, error)
    
    // Fallback: try to load CSS with common patterns
    const fallbackPaths = [
      `/addons/${addonName}/${addonVersion}/frontend/modules/${remoteName}/style.css`,
      `/addons/${addonName}/${addonVersion}/frontend/assets/style.css`,
      `/addons/${addonName}/${addonVersion}/frontend/style.css`
    ]
    
    for (const path of fallbackPaths) {
      try {
        const link = document.createElement('link')
        link.id = cssId
        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.crossOrigin = 'anonymous'
        link.href = path
        
        // Test if the CSS file exists
        const testResponse = await fetch(path, { method: 'HEAD' })
        if (testResponse.ok) {
          document.head.appendChild(link)
          console.log(`Loaded CSS for ${addonName}/${remoteName} from fallback path:`, path)
          break
        }
      } catch (fallbackError) {
        console.warn(`Fallback CSS path failed for ${addonName}/${remoteName}:`, path, fallbackError)
      }
    }
  }
}
