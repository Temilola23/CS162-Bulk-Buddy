# Contributing to Bulk Buddy

## Branching Strategy

We use a simple branch-based workflow:

- **`main`** is the stable, deployable branch. Never push directly to `main`.
- Create a **feature branch** for every piece of work:
  - `feature/user-auth`
  - `feature/trip-feed`
  - `fix/payment-bug`
  - `docs/api-endpoints`
- Open a **Pull Request** to merge your branch into `main`.
- Every PR must be **reviewed and approved** by at least one team member before merging.

## Branch Naming Convention

Use this format: `<type>/<short-description>`

| Type      | Use for                        |
|-----------|--------------------------------|
| `feature` | New features                   |
| `fix`     | Bug fixes                      |
| `docs`    | Documentation changes          |
| `refactor`| Code refactoring               |
| `test`    | Adding or updating tests       |
| `chore`   | Config, dependencies, CI, etc. |

## Pull Request Guidelines

Every PR must:

1. **Have a clear description** -- use the PR template. Anyone reading the PR should understand what it does without looking at other context.
2. **Be self-contained** -- one feature or fix per PR. Keep PRs small and focused.
3. **Include tests** where applicable.
4. **Include docstrings** for new functions/classes.
5. **Be reviewed** by at least one teammate before merging.
6. **Address all review comments** -- either incorporate feedback or explain why you disagree.

## Commit Messages

Write clear, descriptive commit messages:

```
feat: add user registration endpoint
fix: prevent over-claiming of item portions
docs: add API documentation for trip endpoints
test: add unit tests for payment module
```

## MVP Tagging

We will tag each MVP release on `main`. For example:

- `mvp-1` -- First MVP
- `mvp-2` -- Second MVP  
- `mvp-3` -- Final version

## Code Review

When reviewing a PR:

- Be constructive and specific
- Suggest concrete improvements
- Approve only when you're confident the code is correct; When unsure, you can ask a second reviewer.
- Check for edge cases, error handling, and test coverage

## Getting Started

1. Clone the repo: `git clone https://github.com/Temilola23/CS162-Bulk-Buddy.git`
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit
4. Push your branch: `git push -u origin feature/your-feature`
5. Open a Pull Request on GitHub
