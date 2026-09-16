# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Feature 3** (authentication, lists, todos).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| List CRUD (`GET/POST/PUT/DELETE /todo/lists`) | 2 |
| Todo CRUD (`GET/POST /todo/lists/:listId/todos`, `PUT/DELETE /todo/todos/:id`) | 3 |

---

## Authentication (Feature 1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create account |
| `POST` | `/todo/login` | No | Sign in; returns session payload |
| `POST` | `/todo/logout` | Yes | Invalidate session token |

**Register body:**
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

**Login body:**
```json
{
  "username": "jdoe",
  "password": "password123"
}
```

**Register / login success** (`201` register · `200` login):
```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

**Logout success** (`200`):
```json
{
  "message": "Signed out successfully."
}
```

**Auth errors** (`{ "message": "..." }`):

| Status | Message | When |
|--------|---------|------|
| `400` | `First name is required.` | Register, empty/whitespace `fName` |
| `400` | `Last name is required.` | Register, empty/whitespace `lName` |
| `400` | `Email is required.` | Register, empty/whitespace `email` |
| `400` | `Username is required.` | Register or login, empty/whitespace `username` |
| `400` | `Password is required.` | Register or login, missing `password` |
| `400` | `Password must be at least 8 characters.` | Register, `password` shorter than 8 |
| `400` | `Username is already taken.` | Register, duplicate username |
| `400` | `Email is already registered.` | Register, duplicate email |
| `401` | `Invalid username or password.` | Login, unknown user or wrong password |
| `401` | `Unauthorized! No token provided.` | Protected route, missing/empty Bearer token |
| `401` | `Unauthorized! Invalid or expired token.` | Protected route, unknown, expired, or cleared token |

---

## Lists (Feature 2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists` | Yes | Lists owned by caller (array, ordered by `name` ASC) |
| `POST` | `/todo/lists` | Yes | Create a new list |
| `PUT` | `/todo/lists/:listId` | Yes | Rename a list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete a list owned by the caller |

**Create / rename body:**
```json
{ "name": "Groceries" }
```

**List success** (`200` / `201`):
```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**GET success** (`200`): array of list objects (empty `[]` when the caller has none).

**Delete success** (`200`):
```json
{ "message": "List deleted successfully." }
```

**Create ownership:** `userId` in the request body is ignored; the saved owner is always `req.user.id`.

**List errors** (`{ "message": "..." }`):

| Status | Message | When |
|--------|---------|------|
| `400` | `List name is required.` | Create or rename, empty/whitespace `name` |
| `400` | `List name must be 100 characters or fewer.` | Create or rename, `name` longer than 100 |
| `400` | `Invalid list id.` | `listId` is not an integer |
| `404` | `List with id=<id> not found.` | Missing list, or list owned by another user (never `403`) |

---

## Todos (Feature 3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists/:listId/todos` | Yes | Todos in an owned list (incomplete first, then `createdAt` ASC) |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update title and/or `completed` |
| `DELETE` | `/todo/todos/:id` | Yes | Delete a todo owned by the caller |

**Create body:**
```json
{ "title": "Buy milk" }
```

**Todo success** (`200` / `201`):
```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

**GET success** (`200`): array of todo objects (empty `[]` when the list has none).

**Delete success** (`200`):
```json
{ "message": "Todo deleted successfully." }
```

**Create ownership:** `userId` and `listId` in the request body are ignored; owner is `req.user.id` and parent is the owned `:listId`. New todos default `completed: false`. `PUT` may send `title`, `completed`, or both.

**Todo errors** (`{ "message": "..." }`):

| Status | Message | When |
|--------|---------|------|
| `400` | `Todo title is required.` | Create, or update with empty/whitespace `title` |
| `400` | `Todo title must be 255 characters or fewer.` | Create or update, `title` longer than 255 |
| `400` | `Invalid list id.` | Nested `:listId` is not an integer |
| `400` | `Invalid todo id.` | `:id` is not an integer |
| `404` | `List with id=<id> not found.` | Parent list missing or owned by another user |
| `404` | `Todo with id=<id> not found.` | Todo missing or owned by another user (never `403`) |
