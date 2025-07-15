# Project Help Button

This component adds a help button to the project page navigation tabs that provides context-aware help for different project pages.

## Features

- **Always Visible**: The help button remains visible even when navigation tabs overflow
- **Context-Aware**: Shows different help content based on the current page
- **Help Articles**: Links to specific help articles when available
- **Fallback Support**: Opens support chat with prefilled messages for pages without articles
- **Enhanced Context**: Includes project name in fallback messages for better support context

## Implementation

### Components

- `ProjectHelpButton`: The main help button component
- `AppNavLinks`: Updated to support a fixed help button area
- `AppNavLinks.styled.js`: Added styling for help button container

### Usage

The help button is automatically included in the project page navigation:

```tsx
<AppNavLinks
  links={links}
  helpButton={<ProjectHelpButton currentModule={module} projectName={projectName} />}
/>
```

## Configuration

### Help Articles

Pages that have help articles available:

```typescript
const ARTICLE_NAME_TO_ID: Record<string, string> = {
  overview: '7885519', // Project Overview Page
  tasks: '5526719', // Task Progress Page
  lists: '7382645', // Lists
  reviews: '0359490', // Reviewables
  scheduler: '8736562', // Planner Addon
  teams: '6300319', // Teams
  inbox: '7870202', // Inbox and Notifications
  important: '7870202', // Inbox and Notifications
  other: '7870202', // Inbox and Notifications
  cleared: '7870202', // Inbox and Notifications
  powerpack: '7017685', // Power Features
  feed: '8709483', // The Activity Feed
  details: '0219162', // The Details Panel
  'review-sessions': '8669165', // Review Sessions
}
```

### Default Messages

Pages without help articles (will show support chat):

```typescript
const DEFAULT_MESSAGES: Record<string, string> = {
  workfiles: 'Can you help me know more about the Workfiles page?',
  settings: 'Can you help me know more about the Settings page?',
}
```

Any other unmapped page will get a generic message including the project name.

### Adding New Help Articles

To add a help article for a new page:

```typescript
const ARTICLE_NAME_TO_ID: Record<string, string> = {
  // existing mappings...
  newpage: '1234567', // Your New Article
}
```

To add a custom default message:

```typescript
const DEFAULT_MESSAGES: Record<string, string> = {
  // existing messages...
  newpage: 'Can you help me know more about the New Page?',
}
```

## Logic

The component follows simple logic:

1. Check if `currentModule` has an article ID in `ARTICLE_NAME_TO_ID`
2. If yes: Open the help article with `openSupport('ShowArticle', articleId)`
3. If no: Check for a custom message in `DEFAULT_MESSAGES`
4. If found: Open support chat with that message
5. If not found: Generate a generic message including project name

## Testing

### Pages with help articles:

- Overview, Tasks, Lists, Reviews, Scheduler, Teams → Opens specific help articles

### Pages with default messages:

- Workfiles, Settings → Opens support chat with custom message

### Other pages:

- Browser, any unmapped page → Opens support chat with generic message

## Technical Details

### Integration with FeedbackContext

- `openSupport('ShowArticle', articleId)`: Opens specific help article
- `openSupport('NewMessage', message)`: Opens support chat with prefilled message
- `openSupport('Help')`: Opens general help center

### Article ID Format

Uses only numeric article IDs (e.g., `7885519`) as required by Featurebase API.
