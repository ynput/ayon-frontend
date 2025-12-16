export interface HelpArticle {
  articleId?: string
  fallbackMessage?: string
}

export const HELP_ARTICLES: Record<string, HelpArticle> = {
  overview: {
    articleId: '7885519',
  },
  tasks: {
    articleId: '2408349',
  },
  lists: {
    articleId: '7382645',
  },
  reviews: {
    articleId: '8669165',
  },
  reports: {
    articleId: '9869698',
  },
  planner: {
    articleId: '8736562',
  },
  scheduler: {
    articleId: '8736562',
  },
  browser: {
    articleId: '7648006',
  },
  teams: {
    articleId: '6300319',
  },
  bundles: {
    articleId: '4644998',
  },
  accessGroups: {
    articleId: '2635883',
  },
  attributes: {
    articleId: '4636995',
  },
  inbox: {
    articleId: '7870202',
  },
  projectAccess: {
    articleId: '2635883',
  },
}
export const getHelpForPage = (module: string, pageName?: string): HelpArticle => {
  const help = HELP_ARTICLES[module]
  if (help && help.articleId) {
    return help
  }

  // Generate fallback message using page label
  const displayName = pageName || module
  return {
    fallbackMessage: `Can you help me know more about the ${displayName} page?`,
  }
}
