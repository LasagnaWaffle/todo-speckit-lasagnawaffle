# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Feature 4** (authentication, lists, user profile).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| List CRUD (`GET/POST/PUT/DELETE /todo/lists`) | 2 |
| User profile (`GET/PUT /todo/users/:id`) | 4 |

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

## User profile (Feature 4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/users/:id` | Yes | Fetch the authenticated user's profile (`:id` must equal `req.user.id`) |
| `PUT` | `/todo/users/:id` | Yes | Update the authenticated user's profile |

**Update profile request body:**
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`password` is optional. Omit it to leave the current password unchanged. `role` is read-only and ignored if sent.

**Profile success** (`200`):
```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

Password hash is never returned.

**Profile errors** (`{ "message": "..." }`):

| Status | Message | When |
|--------|---------|------|
| `400` | `First name is required.` | Update, empty/whitespace `fName` |
| `400` | `Last name is required.` | Update, empty/whitespace `lName` |
| `400` | `Email is required.` | Update, empty/whitespace `email` |
| `400` | `Username is required.` | Update, empty/whitespace `username` |
| `400` | `Password must be at least 8 characters.` | Update, `password` provided and shorter than 8 |
| `400` | `Username is already taken.` | Update, duplicate username |
| `400` | `Email is already registered.` | Update, duplicate email |
| `400` | `Invalid user id.` | `:id` is not an integer |
| `404` | `User with id=<id> not found.` | `:id` is not the caller's id, or the user row is missing (never `403`) |
