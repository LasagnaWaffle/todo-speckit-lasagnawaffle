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
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hash never returned | Register/login/profile APIs; user `defaultScope` | Features 1, 4 |
| Session = JWT stored server-side; client sends `Authorization: Bearer <token>` | `authenticate` + axios request interceptor | Feature 1 |
| Session lifetime **24 hours** from creation | Session create on register/login (`expiresIn: 86400`) | Feature 1 |
| Login reuses a non-expired session for the same user when one exists | Login controller | Feature 1 |
| Client session payload is stored in `localStorage` key `user` | Login/Register `Utils.setStore` | Feature 1 |
| Logout invalidates the server session (`token` cleared to `""`) and removes client `user`; UI entry is MenuBar **Log out** | Logout API + `authServices.logoutUser` | Features 1, 4 |
| Unauthenticated protected API → `401` | `authenticate` | Feature 1 |
| `401` / unauthorized API response clears `user` and redirects to login | Axios response interceptor | Feature 1 |
| Unauthenticated protected UI → redirect to login | Router `beforeEach` | Feature 1 |
| Signed-in user visiting login/register → redirect to home | Router `beforeEach` | Feature 1 |
| MenuBar hidden on login and register routes | `App.vue` | Feature 2 |
| Default role for new users is `worker`; role is read-only on profile | Register + profile | Features 1, 4 |
| Every authenticated request resolves to `req.user.id` from the session | `authenticate` | Feature 1 |
| Register email uses shared `emailRules` (required + regex); invalid format **"Enter a valid email address."** | `frontend/src/config/validation.js` + Register | Feature 1 |
| Client blocks submit when username empty (**"Username is required."**), password empty (**"Password is required."**), password shorter than 8 characters (**"Password must be at least 8 characters."**), or passwords differ (**"Passwords do not match."**) | Login/Register `v-form` rules | Feature 1 |
| Whitespace-only required name/email/username fields are rejected | Server `trim()` checks + client `trim()` rules | Feature 1 |

## Errors (product convention)

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Error body shape `{ "message": "Human-readable explanation." }` | Controllers | Feature 1 |
| Cross-user access → **`404`**, never `403` | `getAccessibleListOrNull` / `getAccessibleTodoOrNull` / `getAccessibleUserOrNull` | ADR-0002; Features 2–4 |

## Lists

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| All list endpoints require a valid session | `authenticate` on list routes | Feature 2 |
| List `userId` is set from `req.user.id` only; body `userId` is ignored | List create | Feature 2 |
| List ownership never changes | Update only writes `name` | Feature 2 |
| Reads/updates/deletes scoped to `userId = req.user.id` | `findAll` where + `getAccessibleListOrNull` | Feature 2 |
| List name trimmed; empty/whitespace rejected | Create/update API + Dashboard dialogs | Feature 2 |
| List name max **100** characters | Create/update API | Feature 2 |
| Lists returned **alphabetically by name** | `findAll` `order: name ASC` | Feature 2 |
| Lists view is a single dashboard (`My Lists`); add/edit/delete use dialogs; no sidebar/main split | `Dashboard.vue` | Feature 2 |
| Lists view shows only lists returned by `GET /todo/lists` for the signed-in user | `Dashboard.vue` | Feature 2 |
| List rows show **Items**, **Edit list**, and **Delete list** icon actions | `Dashboard.vue` | Features 2–3 |
| Empty lists copy is **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| Client blocks empty/whitespace list names with **"List name is required."** | `Dashboard.vue` create/rename forms | Feature 2 |
| List API failures display in a `<v-alert type="error">` | `Dashboard.vue` | Feature 2 |

## Todos

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| All todo endpoints require a valid session | `authenticate` on todo routes | Feature 3 |
| Todo `userId` and `listId` are set from server context; body values are ignored | Todo create | Feature 3 |
| Parent list must be owned or nested todo routes return **`404`** | `getAccessibleListOrNull` | Feature 3 |
| Todo reads/updates/deletes scoped to `userId = req.user.id` | `getAccessibleTodoOrNull` | Feature 3 |
| Todo title trimmed; empty/whitespace rejected | Create/update API + Dashboard dialogs | Feature 3 |
| Todo title max **255** characters | Create/update API | Feature 3 |
| New todos default `completed: false` | Todo create | Feature 3 |
| Todos ordered **incomplete first**, then `createdAt` ascending | `findAll` order + Dashboard `sortTodos` | Feature 3 |
| Deleting a list cascades to its todos | `List hasMany Todo` `onDelete: CASCADE` | Feature 3 |
| Items managed in a list-items dialog; **+ Add Item** only inside that dialog | `Dashboard.vue` | Feature 3 |
| Empty items copy is **"No todos in this list yet."** | Items dialog | Feature 3 |
| Client blocks empty/whitespace todo titles with **"Todo title is required."** | Add/edit item forms | Feature 3 |
| Completed todos show struck-through / muted title | Items dialog row styling | Feature 3 |
| Todo API failures display in a `<v-alert type="error">` | Items dialog | Feature 3 |

## Profile & MenuBar

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Profile `GET`/`PUT /todo/users/:id` only when `:id === req.user.id` | `user.controller` + `getAccessibleUserOrNull` | Feature 4 |
| Profile fields trimmed; empty required strings rejected | Profile `PUT` + Edit Profile dialog | Feature 4 |
| Username normalized `trim().toLowerCase()` on save | User model hook + profile update | Features 1, 4 |
| Password on profile update is optional; if set, min **8** chars and bcrypt hash; client also blocks mismatch (**"Passwords do not match."**) | Profile `PUT` + Edit Profile dialog | Feature 4 |
| Duplicate username → `"Username is already taken."`; duplicate email → `"Email is already registered."` | Profile `PUT` | Feature 4 |
| Shared `emailRules` for register and Edit Profile | `frontend/src/config/validation.js` | Features 1, 4 |
| After profile save: refresh `localStorage` `user` and dispatch `user-logged-in` | MenuBar | Feature 4 |
| Profile update API failures display in a `<v-alert type="error">`; dialog stays open | MenuBar Edit Profile | Feature 4 |
| MenuBar: user icon → profile dropdown (full name, username, email); **Edit Profile** (`oc-cta`) and **Log out**; no standalone **Sign out** | `MenuBar` | Features 2→4 |
