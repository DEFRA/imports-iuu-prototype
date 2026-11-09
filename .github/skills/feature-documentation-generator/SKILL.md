---
name: "Feature Documentation Generator"
description: "Use when: generating handoff documentation for a completed prototype feature to brief developers on the live build. Analyzes changes and creates an interactive guide covering feature overview, components used, validation rules, design decisions, accessibility, and known limitations."
---

# Feature Documentation Generator

This skill helps you create comprehensive feature documentation for developers who will implement this feature in the live build. It's designed as a collaborative process: I'll analyze the prototype work and extract key information, and you'll supplement with business context and additional considerations.

## How It Works

1. **Provide Context**: Tell me what feature you've just completed in the prototype (or point me to the branch/files)
2. **I Analyze**: I extract information about what was built, components used, validation logic, accessibility considerations, and gotchas
3. **We Collaborate**: I'll ask you clarifying questions to fill in business drivers, edge cases, and anything else developers need to know
4. **Output**: A clean, structured document ready for your backlog

## Documentation Structure

The final document will include:

### 1. Executive Summary
A single sentence describing what this feature does.

### 2. Feature Overview
What the feature does from a user perspective, what problems it solves, and how it improves the experience.

### 3. GOV.UK Components & Custom Elements
- Which standard GOV.UK Design System components are used
- Any custom or novel components built (and why they were necessary)
- Integration patterns between components

### 4. Validation Rules & Error Messages
- Specific validation logic and conditions
- Exact error message wording and when they appear
- Field-level and form-level validation

### 5. Design Decisions
Why certain approaches were taken over alternatives. This helps developers understand the intent, not the implementation approach.

### 6. Accessibility & Browser Support
- WCAG compliance considerations
- Keyboard navigation patterns
- Screen reader support
- Browser/platform requirements

### 7. Known Limitations & Edge Cases
Gotchas, workarounds, and things developers should be aware of that might differ from expected behavior.

### 8. Next Steps for Live Build
Business context, related work, and anything else that helps contextualize this feature in the live build.

---

## Ready to Begin?

Tell me:
1. **What feature have you just completed?** (brief description)
2. **Where should I look?** (branch name, file paths, or just point me to the key changes)

Then I'll analyze the work and we'll build the documentation together!
