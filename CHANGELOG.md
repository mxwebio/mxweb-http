# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-08

### Added

- **Lazy Endpoint Evaluation** - `HttpFactoryOptions.endpoint` now supports function type `(() => Record<string, unknown>)` for lazy evaluation, enabling proper integration with dependency injection and dynamic endpoint registration patterns

### Changed

- **Factory Endpoint Resolution** - Moved endpoint flattening inside the factory function to ensure fresh endpoints on each factory call

## [1.0.0] - 2025-11-13

### Added

#### Core Features

- **HTTP Client Class** - Full-featured HTTP client with support for all standard HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- **TypeScript Support** - Complete type-safe implementation with generic types for request/response data
- **Automatic Authentication** - Built-in token management with customizable storage integration
- **Interceptor System** - Support for request, response, and error interceptors at both static and instance levels
- **URL Interpolation** - Dynamic URL parameter replacement using template strings (e.g., `/users/{id}`)
- **Query Parameter Handling** - Multiple formats supported: object, array of tuples, URLSearchParams, and string
- **File Upload** - Multi-file upload support with progress tracking via XMLHttpRequest
- **FormData Support** - Automatic content-type handling for FormData requests
- **Request Cancellation** - AbortController integration for cancelling in-flight requests
- **Factory Pattern** - `Http.createFactory()` for generating type-safe API client functions from endpoint configurations

#### HTTP Methods

- `http.get<T>(url, query?, options?)` - GET requests with query parameters
- `http.post<T>(url, body?, options?)` - POST requests with request body
- `http.put<T>(url, body?, options?)` - PUT requests for full resource updates
- `http.patch<T>(url, body?, options?)` - PATCH requests for partial updates
- `http.delete<T>(url, options?)` - DELETE requests
- `http.head<T>(url, options?)` - HEAD requests
- `http.options<T>(url, options?)` - OPTIONS requests
- `http.upload<T>(url, file, options?)` - File upload with progress tracking

#### Configuration & Customization

- **Base URL Support** - Configure base URL via constructor or `API_URL` environment variable
- **Custom Headers** - Instance-level default headers and one-time extra headers
- **Storage Integration** - Framework-agnostic storage interface (localStorage, sessionStorage, cookies, etc.)
- **Environment Variables** - Support for `API_URL`, `API_AUTH_TOKEN_KEY`, `API_AUTH_HEADER_KEY`, `API_AUTH_HEADER_TYPE`

#### Authentication Configuration

- `Http.authTokenKey` - Storage key for authentication token (default: `'access_token'`)
- `Http.authHeaderKey` - HTTP header name for authentication (default: `'Authorization'`)
- `Http.authHeaderType` - Token prefix/type (default: `'Bearer'`)
- `Http.authDetectToken` - Array of storage locations to check for tokens
- `Http.storage` - Global storage instance
- `Http.extraHeaders` - One-time headers for next request only

#### Interceptor Methods

- `Http.on(type, handler)` - Register global interceptor for all instances
- `Http.off(type, handler)` - Remove global interceptor
- `http.on(type, handler)` - Register instance-level interceptor
- `http.off(type, handler)` - Remove instance-level interceptor

#### Factory Pattern

- `Http.createFactory(options)` - Create factory function for type-safe API clients
- Support for nested endpoint configurations with automatic flattening
- Async storage support for lazy-loading storage implementations
- Integration with all HTTP methods including file uploads

#### Types & Interfaces

- `HttpMethod` - Enum for HTTP methods
- `HttpQuery` - Union type for query parameter formats
- `HttpRequest<Body, Params, Query, Headers>` - Request configuration interface
- `HttpResponse<T, E>` - Standardized response structure
- `HttpStorage` - Storage interface for authentication tokens
- `HttpProgress` - Upload progress information
- `HttpUploadOptions` - File upload configuration
- `HttpFactoryOptions` - Factory creation options
- `HttpFactory<T, Args, E>` - Factory-generated function interface
- `HttpInterceptorRequest` - Request interceptor function type
- `HttpInterceptorResponse` - Response interceptor function type
- `HttpInterceptorError` - Error interceptor function type
- `HttpInterceptorParameters` - Interceptor registration parameters

#### Utility Methods

- `http.setStorage(storage)` - Set storage implementation for token management
- `http.addHeaders(headers)` - Add default headers to all requests
- `http.isValidQuery(query)` - Validate query parameter format
- `http.isFormData(body)` - Check if body is FormData

### Technical Details

- **Zero Dependencies** - Only peer dependency on `@mxweb/utils`
- **Framework Agnostic** - Works with React, Vue, Angular, Svelte, or vanilla JavaScript
- **Modern JavaScript** - ES6+ with full ESM support
- **Tree-shakeable** - Optimized bundle size with proper module structure
- **TypeScript Native** - Written in TypeScript with full type definitions

---

## [Unreleased]

## [1.2.0] - Future Release

### Planned Features

#### Advanced Configuration

- **Request/Response Transformers** - Transform data before sending and after receiving
  - `transformRequest` - Modify request data before sending
  - `transformResponse` - Transform response data before returning
  - Built-in transformers for common use cases

#### Validation & Error Handling

- **Status Validation** - Custom status code validation
  - `validateStatus(status: number) => boolean` - Define which status codes are successful
  - Default: `status >= 200 && status < 300`

#### Request Control

- **Redirect Configuration** - Control HTTP redirects
  - `maxRedirects` - Maximum number of redirects to follow (default: 5)
  - `followRedirects` - Enable/disable redirect following

#### Advanced Interceptors

- **Async Interceptor Composition** - Chain multiple async interceptors efficiently
- **Interceptor Priority** - Control execution order of interceptors
- **Conditional Interceptors** - Apply interceptors based on request criteria

#### Retry Logic

- **Automatic Retry** - Built-in retry mechanism for failed requests
  - `retry` - Number of retry attempts
  - `retryDelay` - Delay between retries (with exponential backoff)
  - `retryCondition` - Function to determine if request should be retried

#### Request Deduplication

- **Concurrent Request Deduplication** - Prevent duplicate in-flight requests
  - Automatic deduplication based on request signature
  - Configurable deduplication key generation

#### Caching

- **Response Caching** - Cache GET requests
  - Configurable cache duration
  - Cache invalidation strategies
  - Memory-based and storage-based caching options

---

## [1.1.0] - Future Release

### Planned Features

#### Static Methods (Axios-style API)

- **`Http.create(config)`** - Create configured HTTP instance
  - Configure baseURL, headers, storage, timeout in one call
  - Returns pre-configured Http instance
  - Example: `const api = Http.create({ baseURL: 'https://api.example.com' })`

- **Static HTTP Methods** - Quick one-off requests without creating instance
  - `Http.get<T>(url, query?, options?)` - Static GET request
  - `Http.post<T>(url, body?, options?)` - Static POST request
  - `Http.put<T>(url, body?, options?)` - Static PUT request
  - `Http.patch<T>(url, body?, options?)` - Static PATCH request
  - `Http.delete<T>(url, options?)` - Static DELETE request
  - `Http.head<T>(url, options?)` - Static HEAD request
  - `Http.options<T>(url, options?)` - Static OPTIONS request
  - `Http.upload<T>(url, file, options?)` - Static file upload

#### Timeout Support

- **Request Timeout** - Automatic request timeout handling
  - `timeout` - Request timeout in milliseconds
  - Automatic cancellation after timeout
  - Timeout error in interceptors

#### New Configuration Interface

- **`HttpConfig`** - Comprehensive configuration object
  - `baseURL` - Base URL for all requests
  - `headers` - Default headers
  - `storage` - Storage implementation
  - `timeout` - Default timeout for all requests
  - Used by `Http.create()` for instance configuration

#### Enhanced Developer Experience

- **Better Error Messages** - More descriptive error messages
- **Request ID Generation** - Automatic request ID for tracing
- **Debug Mode** - Optional verbose logging for debugging

#### Documentation

- Migration guide from Axios
- Advanced usage examples
- Best practices guide
- Performance optimization tips

### Benefits of 1.1.0

- **Easier Migration from Axios** - Familiar API for Axios users
- **Quick Scripts & Testing** - Static methods for one-off requests
- **Better Defaults** - Timeout prevents hanging requests
- **Flexible Usage** - Choose between static methods or instances based on use case

---

## Migration Notes

### From Custom Fetch Wrappers

Replace your custom fetch wrapper with `@mxweb/http`:

```typescript
// Before
const response = await fetch(url, options);
const data = await response.json();

// After
const { data } = await http.get(url);
```

### Future Migration to 1.1.0

No breaking changes planned. New features will be additive:

```typescript
// Current (still works)
const http = new Http("https://api.example.com");
await http.get("/users");

// New in 1.1.0 (alternative)
const api = Http.create({ baseURL: "https://api.example.com" });
await api.get("/users");

// Or quick requests
await Http.get("https://api.example.com/users");
```

[1.0.0]: https://github.com/mxwebio/mxweb-http/releases/tag/v1.0.0
