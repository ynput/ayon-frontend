// Auto-generated from scraped help articles
// Last updated: 2025-07-13T12:32:45.766Z
// Run 'npm run scrape-help' to update this file

const articles = {
    "tasks-home-page": "2408349",
    "the-details-panel": "0219162",
    "the-activity-feed": "8709483",
    "reviewables": "0359490",
    "project-overview-page": "7885519",
    "task-progress-page": "5526719",
    "inbox-and-notifications": "7870202",
    "planner-addon": "8736562",
    "power-features": "7017685",
    "lists": "7382645",
    "review-sessions": "8669165",
    "teams": "6300319"
} as const

export type HelpArticleKey = keyof typeof articles

export const getHelpArticleId = (key: HelpArticleKey): string | undefined => {
  return articles[key]
}
