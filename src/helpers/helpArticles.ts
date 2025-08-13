export interface HelpArticle {
    articleId?: string
    fallbackMessage?: string
}

export const HELP_ARTICLES: Record<string, HelpArticle> = {
    overview: {
        articleId: '7885519',
    },
    tasks: {
        articleId: '5526719',
    },
    lists: {
        articleId: '7382645',
    }
}

export const getHelpForPage = (module: string, pageName?: string): HelpArticle => {
    const help = HELP_ARTICLES[module]
    if (help) {
        return help
    }


    const displayName = pageName || module
    return {
        fallbackMessage: `Can you help me know more about the ${displayName} page?`,
    }
}
