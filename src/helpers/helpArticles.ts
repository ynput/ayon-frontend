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
    inbox:{
        articleId: '7870202'
    },
    projectAccess: {
        articleId: '2635883',
    }

}
export const getHelpForPage = (module: string, pageName?: string): HelpArticle | null => {
    const help = HELP_ARTICLES[module]
    console.log("HELP ", module, pageName, help)
    if (help && help.articleId) {
        return help
    }
    return null
}
