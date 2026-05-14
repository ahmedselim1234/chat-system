# Chat System

A real-time chat backend built with Node.js, Express, Socket.IO, and MongoDB.

## Features

- JWT authentication (access + refresh tokens)
- Real-time messaging via Socket.IO
- Room creation and management
- Typing indicators
- Online/offline presence
- Message read receipts
- Rate limiting

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MongoDB + Mongoose
- **Real-time:** Socket.IO 4
- **Auth:** JSON Web Tokens (bcryptjs + jsonwebtoken)

## Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

## Setup

```bash
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

**.env variables:**

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/chat_app` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | — |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | — |
| `JWT_ACCESS_EXPIRES` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL | `7d` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

## Running

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

## API Endpoints

All routes are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive tokens |
| POST | `/logout` | Invalidate refresh token |
| POST | `/refresh` | Get a new access token |

### Rooms — `/api/rooms` *(requires auth)*

| Method | Path | Description |
|---|---|---|
| GET | `/` | List public rooms |
| POST | `/` | Create a room |
| GET | `/:id` | Get room by ID |
| POST | `/:id/join` | Join a room |
| POST | `/:id/leave` | Leave a room |
| DELETE | `/:id` | Delete a room (creator only) |

### Messages — `/api/messages` *(requires auth)*

| Method | Path | Description |
|---|---|---|
| GET | `/:roomId` | Get messages for a room |
| DELETE | `/:messageId` | Delete a message |

### Users — `/api/users` *(requires auth)*

| Method | Path | Description |
|---|---|---|
| GET | `/me` | Get current user profile |
| PUT | `/me` | Update profile |

## Socket.IO Events

Connect with a JWT access token:

```js
const socket = io('http://localhost:3001', {
  auth: { token: '<accessToken>' }
});
```

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ roomId }` | Join a socket room |
| `leave_room` | `{ roomId }` | Leave a socket room |
| `send_message` | `{ roomId, content }` | Send a message |
| `typing_start` | `{ roomId }` | Notify others you are typing |
| `typing_stop` | `{ roomId }` | Notify others you stopped typing |
| `mark_read` | `{ roomId, messageId }` | Mark a message as read |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `new_message` | message object | A new message was sent |
| `user_typing` | `{ userId, username }` | Someone started typing |
| `user_stopped_typing` | `{ userId }` | Someone stopped typing |
| `user_online` | `{ userId }` | A user came online |
| `user_offline` | `{ userId, lastSeen }` | A user went offline |
| `message_deleted` | `{ messageId }` | A message was deleted |
| `error` | `{ message }` | An error occurred |

## Manual Testing

Open two browser tabs (served through the running server):

```
http://localhost:3001/test-user1.html   ← Alice
http://localhost:3001/test-user2.html   ← Bob
```

Steps for each user:
1. Click **Register** (or **Login** if already registered)
2. Click **Connect Socket**
3. Alice: click **Create Room** and copy the Room ID
4. Bob: paste the Room ID → click **Join Room**
5. Both users can now send and receive messages in real time
