# Contributing Guidelines

Thank you for your interest in contributing to our project!
Please follow these guidelines to help maintain consistency and streamline the development process.

## General Rules

1. **Issue Creation**: Create issues for everything you won't start working on immediately.
2. **Project Assignment**: Assign issues to `backlog` and `GEM` or `EPIC` and maybe `Ynput planning` projects. Assign PRs to `Ynput planning`.
3. **Labeling**: Use labels to categorize issues appropriately.
4. **Branch Creation**: Use the GitHub "create branch" button to create branches directly from issues.
5. **Semantic Commits**: Adhere to the semantic commit format for clear and descriptive commits.
6. **Issue-less Branches**: You may use branches without associated issues for small tasks and fixes but try to avoid it.

## New Issues

#### Required

1. Add to `Backlog` project.
2. Fill out `Backlog` fields the best you can.
3. Add to `GEM` (General Enhancement & Modifications) project or a specific `EPIC` project.

#### Optional

1. If you know it can be worked on straight away and who can work on it:
   a. Add to Planning project
   b. Fill out fields
   c. Add the Assignee

## New PRs

1. During a work in progress keep as a draft
2. Assign yourself
3. When ready convert from Draft to Ready
4. Assign a reviewer to request a review (@martastain, @LudoHolbik or @Innders)
5. Add to `Ynput planning` project (if you can)

## Branch Names

- Follow the default GitHub suggested format: issue number prefixed, hyphen-separated, and lowercase, e.g., `1234-fix-bug`.
- Avoid using prefixes like `feature/`, `bugfix/`, etc.
- Ensure names are short yet descriptive and use present tense.
- For branches without issues, use descriptive names, e.g., `fix-bug-in-auth`.

## Commits

Commit messages should be formatted as follows:

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: setting|browser|overview|auth|inbox|preview|activities|....
  │
  └─⫸ Commit Type: build|ci|docs|feat|fix|perf|refactor|test
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is optional.

- use imperative, present tense: “change” not “changed” nor “changes”
- don't capitalize first letter
- no dot (.) at the end

### Examples

- `feat(settings): add settings copy`
- `fix(auth): fix session expiration`
- `feat: add video preview endpoint`

## Labels

Use the following labels to categorize issues:

- `bug` — For marking bugs.
- `enhancement` — For improvements to existing features.
- `feature` — For new features.
- `maintenance` — For general maintenance tasks.
- `wontfix` — For issues that will not be addressed (issues only).
- `epic` — For large features or tasks that encompass multiple issues (issues only).

Your contributions are invaluable to us.
Following these guidelines helps us manage the project effectively and ensures that your contributions are integrated smoothly.

Thank you for collaborating with us!

# In Depth Information

## Versioning

Frontend does not have a strict versioning scheme, releases are tagged with the date of the release.

Notes

- Keep the version at `0.0.0-dev` in `package.json`.
- Semantic-release is not enabled, new releases are created automatically with the server CI
- Semantic commit messages are not used but are encouraged.

## General UI Rules

#### Loading state

- Avoid spinners
- Avoid layout shifts when the data loads in.
- Use skeleton shimmer placeholders.
- Use `loading` class for loading shimmer.

Example loading shimmer
![Image](https://github.com/ynput/ayon-frontend/assets/49156310/f589ca02-37a3-41e4-a64a-3e2062083407)
