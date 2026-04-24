# 📦 Delegate App — Build Specification

## 🧠 Product Overview

Delegate is a lightweight delegation tool for small business owners.

Core purpose:
Ensure tasks are followed up on and completed using automated email workflows.

---

## ⚙️ Tech Stack

- Frontend: React + Tailwind + DaisyUI
- Backend (Core): Convex
- Email Service: Mailgun + React Email
- Email Backend: Hono (already scaffolded)
- Authentication: WorkOS

---

## 🧩 Core Features

### 1. Task Creation

Users can:

- Enter task title
- Add optional description
- Set reminder datetime
- Assign task via email (manual or saved assignee)

#### UI Requirements

- Mobile-first design
- Use DaisyUI components:
  - input
  - textarea
  - select
  - button
- Layout should follow a bento-style grouping:
  - Task Info
  - Assignee
  - Reminder

---

### 2. Email Notifications

#### Assignee Email (Immediate)

Sent when task is created.

Includes:

- Task title
- Description
- Assignor info
- Instruction: reply "complete" when finished

---

#### Reminder Email (To Creator)

Sent at reminder time.

Includes:

- Task details
- Assignee info
- Prompt to follow up

---

### 3. Email-Based Completion

- Assignee replies to email
- If email body contains the word "complete"
- Task is marked as completed

Implementation:

- Mailgun inbound webhook → Hono backend
- Extract token from email
- Match task and update status

---

### 4. Saved Assignees

Users can:

- Save frequent assignees
- Select from dropdown during task creation

Fields:

- Name
- Email

---

## 🗄️ Convex Schema

```ts
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    workosId: v.string(),
    email: v.string(),
    name: v.string(),
  }),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    assigneeEmail: v.string(),
    assigneeName: v.optional(v.string()),
    reminderAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("completed")),
    emailToken: v.string(),
    createdAt: v.number(),
  }),

  assignees: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
  }),
});
```
