---
name: prototype-feature-workflow
description: 'Use for feature requests, content changes, layout updates, interactions, component work, and design-probing questions in the Importer or Inspector prototype. Guides context refresh, confirmation before code changes, GOV.UK Frontend and Design System-first decisions, active-version safety, implementation, and validation.'
argument-hint: 'Describe the flow and requested change; attach screenshots or examples when useful.'
---

# Prototype feature workflow

Use this workflow for changes to pages, content, layout, components, validation, and interactions in this prototype.

## Communication style

- Keep all informative user-facing responses short, in plain English, and in bullet points.
- Apply this to confirmations, GOV.UK component or pattern advice, clarifying questions, progress updates, and final summaries.
- Include the key rationale, assumptions, trade-offs, or risks, but avoid long explanations and unnecessary detail.

## 1. Refresh the prototype context

Before proposing or making a change:

- Read the relevant current files, routes, tests, and existing shared components. Treat summaries and memory as clues, not substitutes for checking the current code.
- Check the current worktree and preserve unrelated or in-progress user changes. Do not overwrite or revert them.
- Identify the active Importer and Inspector versions separately by checking the prototype selector, route registration, and current project guidance. The last verified active versions were Part 1 v5 (Importer) and Part 2 v4 (Inspector), but re-check rather than assuming these numbers remain current.
- Work only in the active version of each affected flow. Do not edit archived versions or create a new prototype version unless explicitly requested. If the active version is unclear, stop and ask.
- Inspect the relevant page in the browser when available, including the affected state and nearby content. Look for existing patterns elsewhere in the active flows before designing something new.

## 2. Confirm understanding before changing code

Before editing code, respond with a short plain-English summary that confirms:

- The user outcome and behaviour being requested.
- Which flow, page, state, and active version will change.
- What existing behaviour or content will remain unchanged.
- Any assumptions or design decisions that need agreement.

Wait for the user to confirm before making code changes. If they ask only for confirmation, confirm and stop. If requirements are ambiguous or a decision materially affects behaviour, ask focused questions and wait for the answer rather than guessing.

Do not create a git commit unless the user explicitly asks.

## 3. Start with GOV.UK Frontend and the Design System

- GOV.UK Frontend and the GOV.UK Design System are mandatory starting points and a project priority. Do not start with a custom UI when a suitable GOV.UK component or pattern exists.
- Check the Design System pattern guidance and GOV.UK Frontend component documentation. Prefer the installed GOV.UK Frontend components, macros, and the project's Prototype Kit conventions over hand-built equivalents.
- Reuse existing macros, components, styles, and validation helpers where appropriate; do not rebuild an existing component from scratch.
- Use clear, concise, plain-English content. Keep labels, headings, errors, and links consistent with GOV.UK content guidance.
- Use semantic HTML and consider keyboard operation, focus states, screen-reader names and announcements, colour contrast, responsive layouts, and error summaries.
- Verify current GOV.UK guidance when a component, pattern, or implementation detail is uncertain.

### When the user is exploring or probing for solutions

- Treat a probing question as design exploration, not implementation authorization.
- Identify relevant GOV.UK Frontend components and Design System patterns first. Explain why each could fit, what it would mean for the user's journey, and any constraints or trade-offs.
- Recommend the best-fit standard option. If a custom component or pattern might work better, explain why a standard option is insufficient or less suitable, and compare the custom option's benefits, accessibility implications, and maintenance cost.
- Make the GOV.UK-standard and custom alternatives explicit in the response. Ask which approach the user wants before implementing a custom departure.

### Custom departures

- A custom component or pattern may be used only when no suitable GOV.UK option meets the confirmed need, or a clear user requirement makes a custom approach materially better.
- Before implementing it, name the GOV.UK options considered, explain why they do not fit, describe the proposed departure and its accessibility and maintenance implications, and get the user's approval.
- Mention the custom departure and rationale again in the final summary.

## 4. Implement narrowly

- Make the smallest coherent change that meets the confirmed request.
- Preserve existing journeys, data, URLs, and status behaviour unless the request explicitly changes them.
- Keep Importer and Inspector implementations distinct where their needs differ; align them only where requested or where an established shared pattern applies.
- Update directly related tests and documentation. Do not make unrelated cleanup or broad refactors.

## 5. Verify the requested outcome

- Run the smallest relevant existing tests and checks; add focused tests for new or corrected behaviour.
- For page or layout changes, inspect the rendered page at relevant desktop and mobile widths when possible. Check the exact requested content, alignment, spacing, and interactions, not just whether the page loads.
- Check affected states, including empty, incomplete, error, and multi-item states when relevant.
- Review the final diff and run `git diff --check`. Confirm no archived-version files or unrelated user changes were altered.

## 6. Report back

Summarize what changed and where, give the tests and checks run with their results, and note any custom design-system deviation, assumption, or remaining limitation. Link workspace files in the response.
