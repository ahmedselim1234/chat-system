# Real-Time Chat System — Backend Build Plan

## Project Overview

Build a production-ready real-time chat REST API + WebSocket server using **Express.js**, **Socket.io**, **MongoDB** (Mongoose), and **JWT authentication**. The system supports multiple chat rooms, private messaging, online presence, and message history.

---

## Tech Stack

- **Runtime**: Node.js (ES Modules or CommonJS — use CommonJS)
- **Framework**: Express.js
- **WebSockets**: Socket.io
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (access token + refresh token)
- **Password hashing**: bcryptjs
- **Validation**: express-validator
- **Environment**: dotenv
- **Dev tooling**: nodemon

---

## Folder Structure

```
/src
  /config
    db.js               # MongoDB connection
  /middlewares
    auth.js             # JWT verification middleware
    errorHandler.js     # Global error handler
  /models
    User.js
    Room.js
    Message.js
    RefreshToken.js
  /routes
    auth.routes.js
    room.routes.js
    message.routes.js
    user.routes.js
  /controllers
    auth.controller.js
    room.controller.js
    message.controller.js
    user.controller.js
  /socket
    socket.js           # All Socket.io logic
  /utils
    generateTokens.js   # Access + refresh token helpers
server.js               # Entry point
.env
.env.example
package.json
```

---

## Environment Variables (.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/chat_app
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_ORIGIN=http://localhost:3000
```

---

## Database Models

### User
```
_id, username (unique), email (unique), password (hashed),
avatar (string, optional), isOnline (Boolean, default false),
lastSeen (Date), createdAt
```

### Room
```
_id, name (unique), description, createdBy (ref: User),
members [{ ref: User }], isPrivate (Boolean, default false),
createdAt
```

### Message
```
_id, content (String, required), sender (ref: User),
room (ref: Room), type (enum: text | image, default text),
readBy [{ user: ref User, readAt: Date }],
createdAt
```

### RefreshToken
```
_id, token (String, unique), user (ref: User),
expiresAt (Date), createdAt
```

---

## REST API Endpoints

### Auth Routes — `/api/auth`
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login, returns access + refresh tokens | No |
| POST | `/refresh` | Get new access token using refresh token | No |
| POST | `/logout` | Invalidate refresh token | Yes |
| GET | `/me` | Get current user profile | Yes |

### Room Routes — `/api/rooms`
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/` | Get all public rooms | Yes |
| POST | `/` | Create a new room | Yes |
| GET | `/:id` | Get single room details + members | Yes |
| POST | `/:id/join` | Join a room | Yes |
| POST | `/:id/leave` | Leave a room | Yes |
| DELETE | `/:id` | Delete room (creator only) | Yes |

### Message Routes — `/api/messages`
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/:roomId` | Get paginated message history for a room | Yes |
| DELETE | `/:messageId` | Delete own message | Yes |

### User Routes — `/api/users`
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/` | Get all users (for starting private DMs) | Yes |
| GET | `/:id` | Get user profile | Yes |
| PATCH | `/profile` | Update own username or avatar | Yes |

---

## Authentication Flow

1. **Register**: hash password with bcryptjs (salt rounds: 10), save user, return tokens
2. **Login**: verify password, generate access token (15min) + refresh token (7d), save refresh token in DB
3. **Auth Middleware**: verify `Authorization: Bearer <token>` header on protected routes, attach `req.user`
4. **Refresh**: validate refresh token from DB, issue new access token
5. **Logout**: delete refresh token from DB

---

## Socket.io Architecture

### Setup (`/src/socket/socket.js`)

- Attach Socket.io to the HTTP server
- On every socket connection: verify JWT from `socket.handshake.auth.token`
- If invalid → disconnect immediately
- If valid → attach `socket.userId` and `socket.username`

### Events the Client Emits (Server Listens)

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId }` | Join a socket room |
| `leave_room` | `{ roomId }` | Leave a socket room |
| `send_message` | `{ roomId, content }` | Send message to a room |
| `typing_start` | `{ roomId }` | User started typing |
| `typing_stop` | `{ roomId }` | User stopped typing |
| `mark_read` | `{ roomId, messageId }` | Mark messages as read |

### Events the Server Emits (Client Listens)

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ message object }` | Broadcast new message to room |
| `user_typing` | `{ userId, username }` | Notify room someone is typing |
| `user_stopped_typing` | `{ userId }` | Notify room someone stopped |
| `user_online` | `{ userId }` | Broadcast user came online |
| `user_offline` | `{ userId, lastSeen }` | Broadcast user went offline |
| `message_deleted` | `{ messageId, roomId }` | Notify room a message was removed |
| `error` | `{ message }` | Emit errors back to socket |

### Online Presence Logic

- On connect: update `user.isOnline = true`, emit `user_online` to all connected sockets
- On disconnect: update `user.isOnline = false`, `user.lastSeen = Date.now()`, emit `user_offline`

---

## Middleware Details

### `auth.js`
- Extract Bearer token from `Authorization` header
- Verify with `JWT_ACCESS_SECRET`
- On success: attach `req.user = { id, username, email }`
- On failure: return `401 Unauthorized`

### `errorHandler.js`
- Catch-all error handler as the last middleware in Express
- Format: `{ success: false, message: "...", stack: ... (dev only) }`
- Handle Mongoose validation errors (code 11000 = duplicate key)

---

## Pagination for Messages

- `GET /api/messages/:roomId?page=1&limit=30`
- Sort by `createdAt: -1` (newest first)
- Populate `sender` (select: `_id username avatar`)
- Return: `{ messages, totalPages, currentPage, hasMore }`

---

## Step-by-Step Build Order

1. Initialize project: `npm init`, install all dependencies, set up folder structure
2. Connect MongoDB (`/src/config/db.js`) with error handling and retry logic
3. Create all Mongoose models
4. Build `generateTokens.js` utility (sign access + refresh JWT)
5. Build `auth.js` middleware
6. Build `errorHandler.js` middleware
7. Implement Auth controller + routes (register, login, refresh, logout, me)
8. Implement Room controller + routes (full CRUD + join/leave)
9. Implement Message controller + routes (history with pagination, delete)
10. Implement User controller + routes (list, profile, update)
11. Build Socket.io module (`socket.js`) — connection, auth guard, all events
12. Wire everything in `server.js` (Express + HTTP server + Socket.io)
13. Test all REST endpoints manually (use Postman or Thunder Client)
14. Test Socket.io events (use Postman WebSocket or a simple HTML test client)

---

## `server.js` Structure

```
- Load dotenv
- Create Express app
- Apply middlewares: cors (allow CLIENT_ORIGIN), express.json(), express.urlencoded()
- Mount routes: /api/auth, /api/rooms, /api/messages, /api/users
- Apply errorHandler middleware last
- Create http.createServer(app)
- Initialize Socket.io with CORS config
- Call initSocket(io) from /src/socket/socket.js
- Connect to MongoDB, then listen on PORT
```

---

## API Response Format (consistent across all endpoints)

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "Error description" }
```

---

## Security Checklist

- Passwords never returned in any response (use `.select('-password')` on all User queries)
- JWT secrets loaded from `.env` only
- Refresh tokens stored in DB and deleted on logout
- CORS restricted to `CLIENT_ORIGIN`
- Socket connections rejected if JWT is missing or invalid
- Rate limiting: apply `express-rate-limit` on `/api/auth` routes (max 10 requests per 15 min)

---

## Dependencies to Install

```bash
npm install express mongoose socket.io jsonwebtoken bcryptjs dotenv cors express-validator express-rate-limit
npm install -D nodemon
```

Add to `package.json` scripts:
```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```
