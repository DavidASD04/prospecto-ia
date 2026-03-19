# Copilot Instructions – Dealers CRM

This document defines the coding standards, architecture rules, and development guidelines for this project. GitHub Copilot should strictly follow these instructions when generating or modifying code.

The goal is to maintain a clean, scalable, and consistent codebase.

---

# Project Overview

This project is a lightweight CRM used to manage car dealers that will be contacted via WhatsApp.

Tech stack:

* Next.js 14 (App Router)
* TypeScript
* TailwindCSS
* shadcn/ui
* Prisma ORM
* PostgreSQL
* Railway deployment

The application allows users to:

* store dealer information
* track whether a dealer has been contacted
* filter dealers by status
* open WhatsApp Web with a predefined message

---

# Core Principles

Copilot MUST follow these principles when generating code.

### Clean Code

Code must be:

* readable
* simple
* well structured
* properly typed
* consistent with the project structure

Avoid:

* duplicated logic
* overly complex functions
* deeply nested code
* unnecessary abstractions

Functions should do **one thing only**.

---

# Architecture Rules

This project uses **Next.js App Router architecture**.

Directory structure must remain consistent.

src/
app/
components/
lib/
prisma/
types/

Rules:

* `app/` → pages, layouts, server actions
* `components/` → reusable UI components
* `lib/` → utilities (prisma client, helpers)
* `types/` → shared TypeScript types
* `prisma/` → database schema

Copilot must NOT:

* create random folders
* move core files without reason
* mix UI logic with database logic
* duplicate utilities that already exist

---

# Mandatory shadcn/ui Usage

All UI must use **shadcn/ui components** whenever possible.

Never create raw HTML UI components if a shadcn equivalent exists.

Examples of required components:

* Button
* Input
* Table
* Dialog
* Card
* Badge
* Select
* Checkbox
* Date Picker
* Dropdown Menu
* Form components

Copilot should always prefer **existing shadcn primitives** instead of building custom UI.

---

# Mandatory MCP Usage (shadcn)

This project includes the **shadcn MCP server**.

Copilot MUST consult the **shadcn MCP documentation server** before generating any UI component.

For every UI element such as:

* buttons
* forms
* dialogs
* date pickers
* tables
* dropdowns
* inputs
* cards
* layouts

Copilot should:

1. Query the **shadcn MCP server**
2. Follow the **official shadcn component structure**
3. Use **correct imports from `/components/ui`**

Example imports:

```tsx
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Table } from "@/components/ui/table"
```

Copilot must NOT invent custom UI components if a shadcn component exists.

---

# MANDATORY MODAL PATTERN (VERY IMPORTANT)

This project **does NOT use separate pages for simple actions like viewing or editing records**.

Instead, the application uses **modals (Dialogs)**.

Copilot MUST follow this rule strictly.

When implementing features such as:

* View details
* Edit record
* Create record
* Import data
* Export data
* Confirm actions
* Preview data

Copilot MUST use **shadcn Dialog components (modals)**.

Example use cases:

Correct behavior:

Dealer list
→ Click **"Ver detalle"**
→ Opens **Dialog modal with dealer information**

Dealer list
→ Click **"Editar"**
→ Opens **Dialog modal with edit form**

Dealer list
→ Click **"Importar"**
→ Opens **Dialog modal with import preview**

Incorrect behavior (DO NOT DO THIS):

Creating routes like:

```
/dealers/details
/dealers/edit
/dealers/import
```

Or navigating to new pages for simple UI interactions.

Navigation should only be used for **major sections**, such as:

* Dashboard
* Posibles Clientes
* Clientes Activos
* Configuración

All **record-level actions must use modals**.

Dialogs must use:

```tsx
Dialog
DialogContent
DialogHeader
DialogTitle
DialogDescription
```

Dialogs must also:

* support scroll when content is long
* be mobile responsive
* include close buttons
* support ESC close

---

# Mobile-First Responsive Design (MANDATORY)

All UI must follow **mobile-first design principles**.

Rules:

* Start layout design for **mobile screens first**
* Then progressively enhance for **tablet and desktop**

Use Tailwind responsive utilities like:

* `sm:`
* `md:`
* `lg:`
* `xl:`

Examples:

* stack layouts on mobile
* grid layouts on desktop
* tables should scroll horizontally on small screens

Tables must support:

```
overflow-x-auto
```

Forms and dialogs must remain usable on **small mobile screens**.

---

# UI Design Guidelines

The UI must always be:

* responsive
* mobile-friendly
* accessible
* minimal
* modern

Use Tailwind utilities for layout:

* flex
* grid
* gap
* container
* padding
* margin

Avoid:

* inline styles
* custom CSS unless strictly necessary

---

# Component Design

Components must follow these rules:

* reusable
* small
* focused
* typed with TypeScript

Avoid large monolithic components.

Preferred structure:

components/

dealer-table.tsx
dealer-form.tsx
dealer-filters.tsx
whatsapp-button.tsx

---

# Data Layer

Database access must ONLY be done using **Prisma**.

Never use raw SQL unless strictly necessary.

Create a reusable Prisma client:

lib/prisma.ts

Rules:

* All queries must be typed
* Avoid duplicated queries
* Keep database logic separated from UI

---

# Server Actions

Use **Next.js Server Actions** for mutations.

Examples:

* create dealer
* update contact status
* delete dealer

Server actions must:

* validate input
* return typed responses
* handle errors safely

---

# WhatsApp Integration

The app must generate WhatsApp links using this format:

https://wa.me/{PHONE}?text=Hola

Example:

https://wa.me/18095551234?text=Hola

Links must open in a **new tab**.

Phone numbers must be sanitized before generating the link.

---

# State Management

Prefer simple state management:

* React state
* Server actions
* URL filters

Avoid heavy state libraries unless necessary.

---

# Styling Rules

Use TailwindCSS utilities.

Guidelines:

* avoid inline styles
* avoid custom CSS unless required
* keep styling consistent

Design should remain:

* minimal
* modern
* clean

---

# Performance

Prefer:

* server components where possible
* minimal client components
* optimized queries

Avoid unnecessary re-renders.

---

# Error Handling

Every async operation must:

* handle errors
* return meaningful messages
* avoid crashing the UI

---

# Documentation

Important modules should contain short comments explaining:

* what the module does
* why it exists
* how it should be used

Avoid excessive comments.

Focus on **useful documentation only**.

---

# Security

Always:

* validate inputs
* sanitize phone numbers
* avoid exposing sensitive data

Never expose:

* database URLs
* secrets
* environment variables

---

# Copilot Behavior

When generating code, Copilot should:

* respect the existing architecture
* reuse existing components
* avoid creating duplicate utilities
* prefer extending existing code over replacing it

If a feature already exists, Copilot should extend it rather than rebuild it.

Copilot must prioritize:

1. shadcn components
2. modal-based UI interactions
3. mobile-first responsive layouts
4. clean architecture
5. maintainable code

---

# Goal

Maintain a codebase that is:

* clean
* scalable
* consistent
* production-ready
