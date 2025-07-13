const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

async function updateHelpArticles() {
  console.log('🚀 Started scraping the help articles')
  console.log('📅 Current time:', new Date().toLocaleString())
  
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      '--disable-default-apps'
    ]
  })
  
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  })
  
  try {
    const url = 'https://help.ayon.app/collections/0376560-production-tracking'
    
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      })
      console.log('✅ Page loaded')
    } catch (error) {
      console.log('⚠️  domcontentloaded failed')
      await page.goto(url, {
        waitUntil: 'load',
        timeout: 60000
      })
    }
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(3000)
    
    // Check if page actually loaded
    const title = await page.title()
    console.log('📄 Page title:', title)
    
    // Try to detect if we're blocked or redirected
    const currentUrl = page.url()
    console.log('🔗 Current URL:', currentUrl)
    
    if (currentUrl !== url) {
      throw new Error('⚠️  URL changed')
    }

    const selectors = [
      'a[href*="/articles/"]',
      'a[href*="articles"]',
    ]
    
    let articlesFound = false
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        console.log(`✅ Found elements with a selector: ${selector}`)
        articlesFound = true
      } catch (error) {
        console.log(`❌ Selector ${selector} not found`)
      }
    }
    
    if (!articlesFound) {
      // Try to get page content for debugging
      console.log('🔍 No article links found, checking page content...')
      const bodyText = await page.evaluate(() => document.body.textContent)
      console.log('📝 Page content preview:', bodyText.substring(0, 500))
      
      // Save screenshot for debugging
      await page.screenshot({ path: 'debug-screenshot.png' })
      console.log('📸 Screenshot saved as debug-screenshot.png')
      
      throw new Error('No article links found on the page')
    }
    
    console.log('🔍 Extracting article links with multiple selectors')
    
    const articles = await page.evaluate(() => {
      const articleLinks = [
        ...document.querySelectorAll('a[href*="/articles/"]'),
        ...document.querySelectorAll('a[href*="articles"]'),
      ]
      
      console.log(`Found ${articleLinks.length} article links total`)
      
      const articleMap = {}
      const foundArticles = []
      const processedHrefs = new Set()
      
      articleLinks.forEach((link) => {
        const href = link.getAttribute('href')
        if (!href || processedHrefs.has(href)) {
          return
        }
        
        processedHrefs.add(href)
        
        let title = ''
        
        const button = link.querySelector('button')
        if (button) {
          title = button.textContent.trim()
        }
        
        title = title.replace(/\s+/g, ' ').trim()
        
        // Extract article ID from href
        const articleIdMatch = href.match(/\/articles\/([^\/\?#]+)/)
        
        if (articleIdMatch) {

          const fullArticleId = articleIdMatch[1] // e.g., "2408349-tasks-home-page"
          
          const parts = fullArticleId.split('-')
          const articleId = parts[0] // e.g., "2408349"
          const articleSlug = parts.slice(1).join('-') // e.g., "tasks-home-page"
          
          
          if (articleSlug) {
            // Avoid duplicates by adding number if key exists
            let finalKey = articleSlug
            let counter = 1
            while (articleMap[finalKey]) {
              finalKey = `${articleSlug}${counter}`
              counter++
            }
            
            articleMap[finalKey] = articleId // Store just the numeric ID
            foundArticles.push({ key: finalKey, title, id: articleId })
          }
         
        }
      })
      
      return { articleMap, foundArticles }
    })
    
    if (articles.foundArticles.length === 0) {
      throw new Error('No articles were found and mapped')
    }

    console.log(`Found ${articles.foundArticles.length} articles`)
    
    articles.foundArticles.forEach(article => {
      console.log(`   ✅ ${article.key}: (${article.id})`)
    })
    
    const scrapedAt = new Date().toISOString()
    
    // Generate TypeScript file with types and autocomplete
    const tsOutputPath = path.join(__dirname, '../src/data/help-articles.ts')
    const tsContent = generateTypeScriptFile(articles.articleMap, scrapedAt)
    
    fs.writeFileSync(tsOutputPath, tsContent)
    console.log(`💾 Saved TypeScript to: ${tsOutputPath}`)
    
    console.log('📝 Files updated:')
    console.log(`   - ${tsOutputPath}`)
    
    return articles.articleMap
    
  } catch (error) {
    console.error('❌ Error updating help articles:', error)
    throw error
  } finally {
    await browser.close()
  }
}

function generateTypeScriptFile(articles, scrapedAt) {
  const articleEntries = Object.entries(articles)
    .map(([key, value]) => `    "${key}": "${value}"`)
    .join(',\n')
  
  return `// Auto-generated from scraped help articles
// Last updated: ${scrapedAt}
// Run 'npm run scrape-help' to update this file

const articles = {
${articleEntries}
} as const

export type HelpArticleKey = keyof typeof articles

export const getHelpArticleId = (key: HelpArticleKey): string | undefined => {
  return articles[key]
}
`
}

if (require.main === module) {
  updateHelpArticles()
    .then(() => {
      console.log('\n✅ Help articles updated successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Failed to update help articles:', error.message)
      process.exit(1)
    })
}

module.exports = { updateHelpArticles }
