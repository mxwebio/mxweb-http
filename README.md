# @mxweb/http

A powerful, type-safe HTTP client for JavaScript/TypeScript with support for interceptors, authentication, file uploads, and framework-agnostic storage.

## Features

- 🔒 **Automatic Authentication** - Built-in token management with customizable storage
- 🔌 **Interceptors** - Request, response, and error interceptors for all instances
- 📦 **Type-Safe** - Full TypeScript support with generic types
- 📤 **File Upload** - Multi-file upload with progress tracking
- 🎯 **URL Interpolation** - Dynamic URL parameters with template strings
- 🏭 **Factory Pattern** - Generate type-safe API client functions
- 🔄 **Framework Agnostic** - Works with any storage implementation
- 🚀 **Zero Dependencies** - Only peer dependency on `@mxweb/utils`

## Installation

```bash
npm install @mxweb/http @mxweb/utils
# or
yarn add @mxweb/http @mxweb/utils
# or
pnpm add @mxweb/http @mxweb/utils
```

## Quick Start

```typescript
import { Http } from "@mxweb/http";

// Create an instance
const http = new Http("https://api.example.com");

// Make a GET request
const { data, success, error } = await http.get<User[]>("/users");

if (success) {
  console.log("Users:", data);
} else {
  console.error("Error:", error);
}
```

## Basic Usage

### GET Request

```typescript
// Simple GET
const response = await http.get<User>("/users/123");

// GET with query parameters
const response = await http.get<User[]>("/users", {
  page: 1,
  limit: 10,
  status: "active",
});

// GET with additional options
const response = await http.get<User[]>("/users", query, {
  headers: { "X-Custom-Header": "value" },
  params: { organizationId: "456" },
  signal: abortController.signal,
});
```

### POST Request

```typescript
// Create a new user
const response = await http.post<User>("/users", {
  name: "John Doe",
  email: "john@example.com",
});

// With additional options
const response = await http.post<User>("/users", userData, {
  headers: { "X-Custom-Header": "value" },
  params: { organizationId: "456" },
});
```

### PUT Request

```typescript
const response = await http.put<User>("/users/123", {
  name: "Jane Doe",
  email: "jane@example.com",
});
```

### PATCH Request

```typescript
const response = await http.patch<User>("/users/123", {
  email: "newemail@example.com",
});
```

### DELETE Request

```typescript
const response = await http.delete<void>("/users/123");
```

### HEAD Request

```typescript
const response = await http.head("/users/123");
```

### OPTIONS Request

```typescript
const response = await http.options("/users/123");
```

## File Upload

### Single File Upload

```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const response = await http.upload<UploadResponse>("/upload", file, {
  name: "document",
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress.percentage}%`);
    console.log(`Loaded: ${progress.loaded} / ${progress.total} bytes`);
  },
});
```

### Multiple Files Upload

```typescript
// Using File array
const files = Array.from(fileInput.files);
await http.upload("/upload", files, {
  name: "files[]",
  body: {
    userId: 123,
    category: "documents",
  },
});

// Using FileList
await http.upload("/upload", fileInput.files, {
  name: "attachments",
  onProgress: (progress) => {
    updateProgressBar(progress.percentage);
  },
});
```

## URL Interpolation

Use template strings in URLs with the `params` option:

```typescript
// URL: /users/{userId}/posts/{postId}
const response = await http.get<Post>("/users/{userId}/posts/{postId}", null, {
  params: {
    userId: 123,
    postId: 456,
  },
});
// Actual request: /users/123/posts/456
```

## Interceptors

### Request Interceptor

Modify requests before they are sent:

```typescript
// Instance-level interceptor
http.on("request", async (options) => {
  console.log("Making request to:", options.url);

  // Add custom headers
  options.headers = {
    ...options.headers,
    "X-Request-Time": Date.now().toString(),
  };

  return options;
});

// Static interceptor (applies to all instances)
Http.on("request", async (options) => {
  // Apply to all Http instances
  return options;
});
```

### Response Interceptor

Process responses before they are returned:

```typescript
http.on("response", async (response) => {
  console.log("Response status:", response.status);

  // Log or transform response
  if (!response.ok) {
    console.error("Request failed:", response.statusText);
  }

  return response;
});
```

### Error Interceptor

Handle errors globally:

```typescript
http.on("error", async (error) => {
  console.error("Request error:", error);

  // Send to error tracking service
  errorTracker.log(error);

  // Show notification to user
  showErrorNotification("Request failed. Please try again.");
});
```

### Remove Interceptor

```typescript
const requestInterceptor = async (options) => {
  // ...
  return options;
};

http.on("request", requestInterceptor);

// Later, remove it
http.off("request", requestInterceptor);
```

## Authentication

### Automatic Token Management

The Http client automatically manages authentication tokens:

```typescript
// Set up storage (localStorage example)
http.setStorage(localStorage);

// Token is automatically retrieved and added to requests
// Default header: Authorization: Bearer {token}
const response = await http.get("/protected-resource");
```

### Configure Authentication

```typescript
// Using static properties
Http.authTokenKey = "access_token"; // Storage key
Http.authHeaderKey = "Authorization"; // Header name
Http.authHeaderType = "Bearer"; // Token prefix

// Or using environment variables
// API_AUTH_TOKEN_KEY=access_token
// API_AUTH_HEADER_KEY=Authorization
// API_AUTH_HEADER_TYPE=Bearer
```

### Custom Storage Implementation

```typescript
import { HttpStorage } from "@mxweb/http";

class CookieStorage implements HttpStorage {
  getItem(key: string): string | null {
    const match = document.cookie.match(new RegExp(`${key}=([^;]+)`));
    return match ? match[1] : null;
  }

  setItem(key: string, value: string): void {
    document.cookie = `${key}=${value}; path=/`;
  }

  removeItem(key: string): void {
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  }
}

http.setStorage(new CookieStorage());
```

## Factory Pattern

Create type-safe API client functions from endpoint definitions:

```typescript
import { Http, HttpMethod } from "@mxweb/http";

// Define your endpoints
const endpoints = {
  "user.list": "/api/users",
  "user.get": "/api/users/{id}",
  "user.create": "/api/users",
  "user.update": "/api/users/{id}",
  "user.delete": "/api/users/{id}",
  "post.list": "/api/posts",
  "post.upload": "/api/posts/{id}/attachments",
};

// Create factory function
const factory = Http.createFactory({
  baseURL: "https://api.example.com",
  endpoint: endpoints,
  storage: localStorage, // or async function
});

// Generate API functions
const getUsers = factory<User[]>("user.list", HttpMethod.GET);
const getUser = factory<User, [{ id: string }]>("user.get", HttpMethod.GET);
const createUser = factory<User, [CreateUserInput]>("user.create", HttpMethod.POST);
const updateUser = factory<User, [UpdateUserInput]>("user.update", HttpMethod.PUT);
const deleteUser = factory<void>("user.delete", HttpMethod.DELETE);
const uploadAttachment = factory<UploadResponse, [File, HttpUploadOptions]>(
  "post.upload",
  "UPLOAD"
);

// Use the generated functions
const { data: users } = await getUsers.fn();
const { data: user } = await getUser.fn({ id: "123" });
const { data: newUser } = await createUser.fn({
  name: "John Doe",
  email: "john@example.com",
});

// Upload with factory
const file = document.querySelector("input").files[0];
const { data: upload } = await uploadAttachment.fn(file, {
  name: "attachment",
  params: { id: "123" },
  onProgress: (p) => console.log(`${p.percentage}%`),
});
```

### Nested Endpoints

```typescript
const endpoints = {
  api: {
    users: {
      list: "/users",
      get: "/users/{id}",
    },
    posts: {
      list: "/posts",
      create: "/posts",
    },
  },
};

// The factory flattens nested objects with dot notation
const factory = Http.createFactory({ endpoint: endpoints });

const getUsers = factory<User[]>("api.users.list", HttpMethod.GET);
const getPosts = factory<Post[]>("api.posts.list", HttpMethod.GET);
```

### Async Storage

```typescript
const factory = Http.createFactory({
  baseURL: "https://api.example.com",
  endpoint: endpoints,
  storage: async () => {
    // Lazy load storage
    const { default: storage } = await import("./storage");
    return storage;
  },
});
```

## Additional Headers

### Instance Headers

```typescript
// Add headers to specific instance
http.addHeaders({
  "X-API-Version": "v1",
  "X-Client-Id": "web-app",
});
```

### One-Time Headers

```typescript
// Add headers for one request only
Http.extraHeaders = {
  "X-Request-ID": generateRequestId(),
};

await http.get("/users"); // Includes X-Request-ID
await http.get("/posts"); // Does NOT include X-Request-ID
```

## Response Structure

All requests return a standardized response:

```typescript
interface HttpResponse<T = unknown, E = unknown> {
  success: boolean; // true if status 200-299
  data: T; // Response data
  status: number; // HTTP status code
  statusText: string; // HTTP status text
  headers: Record<string, string>; // Response headers
  error: E | null; // Error data (if success is false)
}
```

### Example Usage

```typescript
const { success, data, error, status, headers } = await http.get<User>("/users/123");

if (success) {
  console.log("User:", data);
  console.log("Content-Type:", headers["content-type"]);
} else {
  console.error("Error:", error);
  console.log("Status:", status);
}
```

## Query Parameters

### Object Format

```typescript
await http.get("/users", {
  page: 1,
  limit: 10,
  status: "active",
  sort: "name",
});
// Request: /users?page=1&limit=10&status=active&sort=name
```

### Array Format

```typescript
await http.get("/users", [
  ["page", 1],
  ["limit", 10],
  ["tags", "javascript"],
  ["tags", "typescript"],
]);
```

### URLSearchParams

```typescript
const params = new URLSearchParams();
params.append("page", "1");
params.append("limit", "10");

await http.get("/users", params);
```

### String Format

```typescript
await http.get("/users", "page=1&limit=10&status=active");
```

## FormData

```typescript
const formData = new FormData();
formData.append("name", "John Doe");
formData.append("email", "john@example.com");

// Content-Type is automatically set to multipart/form-data
const response = await http.post<User>("/users", formData);
```

## Abort Requests

```typescript
const controller = new AbortController();

// Start request
const requestPromise = http.get("/users", null, {
  signal: controller.signal,
});

// Cancel after 5 seconds
setTimeout(() => {
  controller.abort();
}, 5000);

try {
  const response = await requestPromise;
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request was cancelled");
  }
}
```

## Environment Variables

The Http client supports these environment variables:

- `API_URL` - Base URL for all requests (default: `/`)
- `API_AUTH_TOKEN_KEY` - Storage key for auth token (default: `access_token`)
- `API_AUTH_HEADER_KEY` - Header name for auth token (default: `Authorization`)
- `API_AUTH_HEADER_TYPE` - Token prefix (default: `Bearer`)

## TypeScript Support

Full TypeScript support with generics:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserInput {
  name: string;
  email: string;
}

interface ApiError {
  message: string;
  code: string;
}

// Type-safe request
const response = await http.post<User, CreateUserInput, ApiError>("/users", {
  name: "John",
  email: "john@example.com",
});

// TypeScript knows the types
if (response.success) {
  console.log(response.data.name); // string
} else {
  console.log(response.error?.message); // string | undefined
}
```

## API Reference

### Http Class

#### Constructor

```typescript
constructor(baseURL?: string)
```

#### Static Properties

- `Http.method` - HttpMethod enum
- `Http.authTokenKey` - Token storage key (default: `'access_token'`)
- `Http.authHeaderKey` - Auth header name (default: `'Authorization'`)
- `Http.authHeaderType` - Token prefix (default: `'Bearer'`)
- `Http.authDetectToken` - Storage detection array
- `Http.extraHeaders` - One-time headers
- `Http.storage` - Global storage instance

#### Static Methods

- `Http.on(...params)` - Register global interceptor
- `Http.off(...params)` - Remove global interceptor
- `Http.createFactory(options)` - Create factory function

#### Instance Methods

- `setStorage(storage)` - Set storage implementation
- `addHeaders(headers)` - Add default headers
- `on(...params)` - Register instance interceptor
- `off(...params)` - Remove instance interceptor
- `request(options)` - Make HTTP request
- `get(url, query?, options?)` - GET request
- `post(url, body?, options?)` - POST request
- `put(url, body?, options?)` - PUT request
- `patch(url, body?, options?)` - PATCH request
- `delete(url, options?)` - DELETE request
- `head(url, options?)` - HEAD request
- `options(url, options?)` - OPTIONS request
- `upload(url, file, options?)` - Upload file(s)

### Enums

#### HttpMethod

```typescript
enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}
```

## Examples

### React Hook

```typescript
import { Http } from "@mxweb/http";
import { useState, useEffect } from "react";

const http = new Http("https://api.example.com");

function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      const { success, data, error } = await http.get<User[]>("/users");

      if (success) {
        setUsers(data);
      } else {
        setError(error as Error);
      }

      setLoading(false);
    }

    fetchUsers();
  }, []);

  return { users, loading, error };
}
```

### Vue Composable

```typescript
import { Http } from "@mxweb/http";
import { ref } from "vue";

const http = new Http("https://api.example.com");

export function useUsers() {
  const users = ref<User[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  async function fetchUsers() {
    loading.value = true;
    const { success, data, error: err } = await http.get<User[]>("/users");

    if (success) {
      users.value = data;
    } else {
      error.value = err as Error;
    }

    loading.value = false;
  }

  fetchUsers();

  return { users, loading, error, refetch: fetchUsers };
}
```

### Retry Logic

```typescript
async function fetchWithRetry<T>(
  requestFn: () => Promise<HttpResponse<T>>,
  maxRetries = 3
): Promise<HttpResponse<T>> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await requestFn();
      if (response.success) return response;
      lastError = response;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }

  throw lastError;
}

// Usage
const response = await fetchWithRetry(() => http.get<User[]>("/users"));
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [GitHub Repository](https://github.com/mxwebio/mxweb-http)
- [NPM Package](https://www.npmjs.com/package/@mxweb/http)
- [Issue Tracker](https://github.com/mxwebio/mxweb-http/issues)
