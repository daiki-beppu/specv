# Code Blocks

## TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const greet = (user: User): string => {
  return `Hello, ${user.name}!`;
};
```

## JavaScript

```javascript
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});
```

## JSON

```json
{
  "name": "specv",
  "version": "0.2.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

## HTML

```html
<div class="container">
  <h1>Hello</h1>
  <p>This is a paragraph.</p>
</div>
```

## CSS

```css
.container {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-color);
}
```

## Bash

```bash
#!/bin/bash
echo "Installing dependencies..."
npm install
npm run build
```

## Inline Code

Use `nr dev` to start the development server. The `--port` flag is optional.

## No Language Specified

```
This is a plain code block without language specification.
It should render without syntax highlighting.
```
