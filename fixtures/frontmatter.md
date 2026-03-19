---
title: Frontmatter Test
description: YAML frontmatter should not render as <hr>
tags:
  - test
  - markdown
date: 2026-03-19
---

# Frontmatter Test

This document has YAML frontmatter above. It should **not** appear as a horizontal rule (`<hr>`).

## Expected behavior

- The `---` delimiters should be invisible
- No horizontal lines should appear at the top of this document
- Only this heading and content should be visible

---

This horizontal rule above is intentional (written in the body, not frontmatter) and **should** be visible.
