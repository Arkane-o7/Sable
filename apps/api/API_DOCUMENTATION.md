# Sable API Documentation

**Base URL:** `http://localhost:3001` (development) | `https://api.sable.app` (production)

**Version:** 1.0.0

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Chat](#chat)
  - [Conversations](#conversations)
  - [User](#user)
  - [Search](#search)
- [Error Handling](#error-handling)
- [Types](#types)

---

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header.

```http
Authorization: Bearer <jwt_token>
```

The JWT token is obtained from WorkOS after user authentication. The token contains:

```json
{
  "sub": "user_workos_id",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "profile_picture_url": "https://..."
}
```

### Unauthenticated Response

```json
{
  "error": "Missing authorization header"
}
```

**Status:** `401 Unauthorized`

---

## Rate Limiting

API requests are rate-limited per user:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Chat (`/api/chat/*`) | 30 requests | 60 seconds |
| Search (`/api/search`) | 100 requests | 60 seconds |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1704153600000
```

### Rate Limit Exceeded Response

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

**Status:** `429 Too Many Requests`

---

## Endpoints

### Health

#### `GET /health`

Health check endpoint. No authentication required.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-02T12:00:00.000Z",
  "version": "1.0.0"
}
```

**Status:** `200 OK`

---

### Chat

#### `POST /api/chat`

Send a chat message and receive a complete response.

**Authentication:** Required

**Rate Limit:** 30/minute

**Request Body:**

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | `string (UUID)` | No | Existing conversation ID. If omitted, creates new conversation. |
| `messages` | `ChatMessage[]` | Yes | Array of messages (min 1, max content length 32000) |

**ChatMessage Object:**

| Field | Type | Values |
|-------|------|--------|
| `role` | `string` | `"user"` \| `"assistant"` \| `"system"` |
| `content` | `string` | Message content (1-32000 characters) |

**Response:**

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
}
```

**Status:** `200 OK`

---

#### `POST /api/chat/stream`

Send a chat message and receive a streaming response via Server-Sent Events (SSE).

**Authentication:** Required

**Rate Limit:** 30/minute

**Request Body:** Same as `POST /api/chat`

**Response:** `text/event-stream`

```
data: {"conversationId":"550e8400-e29b-41d4-a716-446655440000"}

data: {"content":"Hello"}

data: {"content":"!"}

data: {"content":" I'm"}

data: {"content":" doing"}

data: {"content":" well"}

data: [DONE]
```

**Client-Side Example (JavaScript):**

```javascript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        console.log('Stream complete');
        return;
      }
      const { content, conversationId } = JSON.parse(data);
      if (content) {
        console.log('Received:', content);
      }
    }
  }
}
```

---

### Conversations

#### `GET /api/conversations`

List all conversations for the authenticated user.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | `number` | `50` | Maximum conversations to return |
| `offset` | `number` | `0` | Pagination offset |

**Response:**

```json
{
  "conversations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-uuid",
      "title": "Help with React hooks",
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-02T15:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "userId": "user-uuid",
      "title": "Python debugging",
      "createdAt": "2026-01-01T09:00:00.000Z",
      "updatedAt": "2026-01-01T09:45:00.000Z"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

**Status:** `200 OK`

---

#### `GET /api/conversations/:id`

Get a single conversation with all its messages.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (UUID)` | Conversation ID |

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-uuid",
  "title": "Help with React hooks",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-02T15:30:00.000Z",
  "messages": [
    {
      "id": "msg-uuid-1",
      "conversationId": "550e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "How do I use useEffect?",
      "createdAt": "2026-01-01T10:00:00.000Z"
    },
    {
      "id": "msg-uuid-2",
      "conversationId": "550e8400-e29b-41d4-a716-446655440000",
      "role": "assistant",
      "content": "useEffect is a React hook that...",
      "createdAt": "2026-01-01T10:00:05.000Z"
    }
  ]
}
```

**Status:** `200 OK`

**Error (Not Found):**

```json
{
  "error": "Conversation not found"
}
```

**Status:** `404 Not Found`

---

#### `POST /api/conversations`

Create a new empty conversation.

**Authentication:** Required

**Request Body:**

```json
{
  "title": "My new chat"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | No | Conversation title (1-100 chars). Defaults to "New Chat" |

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-uuid",
  "title": "My new chat",
  "createdAt": "2026-01-02T12:00:00.000Z",
  "updatedAt": "2026-01-02T12:00:00.000Z"
}
```

**Status:** `201 Created`

---

#### `PATCH /api/conversations/:id`

Update a conversation's title.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (UUID)` | Conversation ID |

**Request Body:**

```json
{
  "title": "Updated title"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | New title (1-100 chars) |

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-uuid",
  "title": "Updated title",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-02T12:00:00.000Z"
}
```

**Status:** `200 OK`

---

#### `DELETE /api/conversations/:id`

Delete a conversation and all its messages.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string (UUID)` | Conversation ID |

**Response:**

```json
{
  "success": true
}
```

**Status:** `200 OK`

---

#### `DELETE /api/conversations`

Delete ALL conversations for the authenticated user.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confirm` | `string` | Yes | Must be `"true"` to confirm deletion |

**Example:**

```http
DELETE /api/conversations?confirm=true
```

**Response:**

```json
{
  "success": true
}
```

**Status:** `200 OK`

**Error (Missing Confirmation):**

```json
{
  "error": "Confirmation required",
  "message": "Add ?confirm=true to delete all conversations"
}
```

**Status:** `400 Bad Request`

---

### User

#### `GET /api/user`

Get the current authenticated user's profile and preferences.

**Authentication:** Required

**Response:**

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "dark",
    "defaultModel": "llama-3.3-70b-versatile",
    "shortcuts": {
      "newChat": "Ctrl+Shift+N"
    }
  }
}
```

**Status:** `200 OK`

---

#### `PATCH /api/user`

Update the user's profile.

**Authentication:** Required

**Request Body:**

```json
{
  "name": "Jane Doe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Display name (1-100 chars) |

**Response:**

```json
{
  "success": true
}
```

**Status:** `200 OK`

---

#### `PUT /api/user/preferences`

Update user preferences.

**Authentication:** Required

**Request Body:**

```json
{
  "theme": "dark",
  "defaultModel": "llama-3.3-70b-versatile",
  "shortcuts": {
    "newChat": "Ctrl+Shift+N",
    "focusMode": "Ctrl+`"
  }
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `theme` | `string` | `"light"` \| `"dark"` \| `"system"` | UI theme |
| `defaultModel` | `string` | Any valid model ID | Default LLM model |
| `shortcuts` | `object` | Key-value pairs | Custom keyboard shortcuts |

**Response:**

```json
{
  "success": true
}
```

**Status:** `200 OK`

---

### Search

#### `POST /api/search`

Search the web using Tavily API.

**Authentication:** Required

**Rate Limit:** 100/minute

**Request Body:**

```json
{
  "query": "latest news about AI"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | `string` | Yes | Search query (1-500 chars) |

**Response:**

```json
{
  "query": "latest news about AI",
  "answer": "Recent developments in AI include...",
  "results": [
    {
      "title": "AI Breakthrough in 2026",
      "url": "https://example.com/ai-news",
      "content": "Scientists have announced a major breakthrough...",
      "score": 0.95
    },
    {
      "title": "New AI Models Released",
      "url": "https://example.com/new-models",
      "content": "Several companies have released new AI models...",
      "score": 0.87
    }
  ]
}
```

**Status:** `200 OK`

**Error (Service Unavailable):**

```json
{
  "error": "Search not configured",
  "message": "Tavily API key is not set"
}
```

**Status:** `503 Service Unavailable`

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error type or message",
  "message": "Detailed description (optional)"
}
```

### Common HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Request succeeded |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request body or parameters |
| `401` | Unauthorized | Missing or invalid authentication |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side error |
| `503` | Service Unavailable | External service not configured |

### Validation Errors

When request validation fails:

```json
{
  "error": "Validation failed",
  "issues": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 1 character(s)",
      "path": ["messages", 0, "content"]
    }
  ]
}
```

**Status:** `400 Bad Request`

---

## Types

### TypeScript Definitions

```typescript
// Message roles
type MessageRole = 'user' | 'assistant' | 'system';

// Chat message (for API requests)
interface ChatMessage {
  role: MessageRole;
  content: string;
}

// Stored message (from database)
interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

// Conversation
interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// User
interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

// User preferences
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultModel: string;
  shortcuts: Record<string, string>;
}

// Search result
interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// Search response
interface SearchResponse {
  query: string;
  answer?: string;
  results: SearchResult[];
}

// Chat request
interface ChatRequest {
  conversationId?: string;
  messages: ChatMessage[];
}

// Chat response
interface ChatResponse {
  conversationId: string;
  content: string;
}

// API error
interface ApiError {
  error: string;
  message?: string;
}
```

---

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
class SableClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Chat
  async chat(messages: ChatMessage[], conversationId?: string) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, conversationId }),
    });
  }

  // Stream chat
  async *chatStream(messages: ChatMessage[], conversationId?: string) {
    const response = await fetch(`${this.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ messages, conversationId }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          yield JSON.parse(line.slice(6));
        }
      }
    }
  }

  // Conversations
  async getConversations(limit = 50, offset = 0) {
    return this.request(`/api/conversations?limit=${limit}&offset=${offset}`);
  }

  async getConversation(id: string) {
    return this.request(`/api/conversations/${id}`);
  }

  async deleteConversation(id: string) {
    return this.request(`/api/conversations/${id}`, { method: 'DELETE' });
  }

  // User
  async getUser() {
    return this.request('/api/user');
  }

  async updatePreferences(preferences: Partial<UserPreferences>) {
    return this.request('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Search
  async search(query: string) {
    return this.request('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }
}

// Usage
const client = new SableClient('http://localhost:3001', 'your-jwt-token');

// Simple chat
const response = await client.chat([
  { role: 'user', content: 'Hello!' }
]);
console.log(response.content);

// Streaming chat
for await (const chunk of client.chatStream([
  { role: 'user', content: 'Tell me a story' }
])) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
```

---

## Changelog

### v1.0.0 (2026-01-02)

- Initial release
- Chat endpoints with streaming support
- Conversation management
- User profiles and preferences
- Web search integration
- Rate limiting
- WorkOS authentication
