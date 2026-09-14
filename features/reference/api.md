# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Feature 1** (authentication).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |

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
