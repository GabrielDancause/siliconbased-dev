# Task: Build chmod Calculator Tool Page

## File to create
`public/chmod-calculator.html` — a single, self-contained HTML file (inline CSS + JS, no external dependencies except Google Fonts).

## What it is
An interactive Linux file permissions (chmod) calculator. User toggles read/write/execute for owner/group/others and instantly sees the numeric (octal) and symbolic notation update in real-time. Also works in reverse — type an octal number like `755` and the toggles update.

## Design Requirements
- **Dark theme** matching the rest of siliconbased.dev:
  - Background: `#0a0b10`
  - Card backgrounds: `#111318`
  - Borders: `#1e2030`
  - Accent color: `#818cf8` (indigo)
  - Text: `#e0e0e0` primary, `#888` secondary
  - Font: `Inter` for UI, `JetBrains Mono` for code/values
- **Mobile-first responsive** — must look great on phones
- Load Google Fonts: `Inter:wght@400;500;600;700;800;900` and `JetBrains+Mono:wght@400;500;600`

## Layout (top to bottom)

### 1. Hero
- Title: "chmod Calculator" with emoji ⚙️
- Subtitle: "Visual Linux file permission editor. Toggle permissions, get the command."
- Keep it compact (less padding than DevBox)

### 2. Octal Input
- Large, centered 3-digit input field (styled like a code editor)
- Default value: `755`
- Auto-updates the toggle grid below when user types
- Show the symbolic notation next to it: `-rwxr-xr-x`
- Show the full command: `chmod 755 filename`

### 3. Permission Toggle Grid
- 3 columns: **Owner** | **Group** | **Others**
- 3 rows per column: **Read (r)** | **Write (w)** | **Execute (x)**
- Each permission is a toggle button/switch
- When toggled ON: indigo background (`#818cf8`), white text
- When toggled OFF: dark background (`#1e2030`), dim text
- Clicking any toggle instantly updates the octal input, symbolic notation, and command

### 4. Quick Presets
- Row of preset buttons for common permissions:
  - `777` — "Full access (everyone)"
  - `755` — "Owner full, others read+execute"
  - `644` — "Owner read+write, others read-only"
  - `600` — "Owner read+write only"
  - `400` — "Owner read-only"
  - `000` — "No permissions"
- Clicking a preset updates everything

### 5. Command Output
- Card showing the full chmod command: `chmod 755 filename`
- Editable filename field (default: `filename`)
- Copy button
- Also show: `chmod u=rwx,g=rx,o=rx filename` (symbolic form)

### 6. SEO Content Section (below the tool)
- H2: "How chmod Works"
- Brief explanation of Linux file permissions (2-3 paragraphs)
- H2: "Understanding Permission Numbers"
  - Table/grid showing: 0=none, 1=execute, 2=write, 3=write+execute, 4=read, 5=read+execute, 6=read+write, 7=read+write+execute
- H2: "Common chmod Examples"
  - List of common commands with explanations
- H2: "Special Permissions"
  - Brief mention of setuid (4), setgid (2), sticky bit (1)

### 7. Footer
- `© 2025 siliconbased.dev · A GAB Ventures property`
- Link to https://gab.ae

## SEO
- Title tag: `chmod Calculator — Visual Linux File Permission Editor | Free Online Tool`
- Meta description: `Interactive chmod calculator for Linux and Unix. Toggle read, write, and execute permissions visually and get the octal notation, symbolic notation, and ready-to-use chmod commands instantly. Free, no signup.`
- Add JSON-LD WebApplication schema (same pattern as devbox.html)
- Use semantic HTML (h1, h2, h3, proper sections)

## Technical Notes
- **Zero dependencies** — vanilla HTML/CSS/JS only (plus Google Fonts CDN)
- All computation client-side
- Must work offline after initial load
- No frameworks, no build step — just a single .html file
- Test by opening the file directly in a browser

## Reference
Look at `public/devbox.html` in this repo for the styling pattern, card components, copy button behavior, and footer format.
