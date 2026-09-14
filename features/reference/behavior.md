# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev` (not API shapes or columns — see [api.md](./api.md) and [data-model.md](./data-model.md)).

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md` (**FR-00N** + Gherkin). Deep scenarios stay in the introducing feature; this file is an **index**.

**Related:** [ADR-0002 — Security architecture](../../docs/adr/0002-security-architecture.md) (404 vs 403, ownership helpers)

---

## Auth & sessions

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login is **username + password** (not email-only) | Auth API | Feature 1 |
| Username is trimmed and stored lowercase | `User` `beforeValidate` hook | Feature 1 |
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hash never returned | Register/login APIs; user `defaultScope` | Feature 1 |
| Session = JWT stored server-side; client sends `Authorization: Bearer <token>` | `authenticate` + axios request interceptor | Feature 1 |
| Session lifetime **24 hours** from creation | Session create on register/login (`expiresIn: 86400`) | Feature 1 |
| Login reuses a non-expired session for the same user when one exists | Login controller | Feature 1 |
| Client session payload is stored in `localStorage` key `user` | Login/Register `Utils.setStore` | Feature 1 |
| Logout invalidates the server session (`token` cleared to `""`) and removes client `user` | Logout API + `authServices.logoutUser` | Feature 1 |
| Unauthenticated protected API → `401` | `authenticate` | Feature 1 |
| `401` / unauthorized API response clears `user` and redirects to login | Axios response interceptor | Feature 1 |
| Unauthenticated protected UI → redirect to login | Router `beforeEach` | Feature 1 |
| Signed-in user visiting login/register → redirect to home | Router `beforeEach` | Feature 1 |
| Home welcome uses the user's first name; **Sign out** is a standalone button; no `MenuBar` | `Home.vue` | Feature 1 |
| Default role for new users is `worker` | `users.role` default | Feature 1 |
| Every authenticated request resolves to `req.user.id` from the session | `authenticate` | Feature 1 |
| Register email uses shared `emailRules` (required + regex); invalid format **"Enter a valid email address."** | `frontend/src/config/validation.js` + Register | Feature 1 |
| Client blocks submit when username empty (**"Username is required."**), password empty (**"Password is required."**), password shorter than 8 characters (**"Password must be at least 8 characters."**), or passwords differ (**"Passwords do not match."**) | Login/Register `v-form` rules | Feature 1 |
| Whitespace-only required name/email/username fields are rejected | Server `trim()` checks + client `trim()` rules | Feature 1 |

## Errors (product convention)

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Error body shape `{ "message": "Human-readable explanation." }` | Controllers | Feature 1 |
