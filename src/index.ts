/* eslint-disable @typescript-eslint/no-explicit-any */
import { flatten, getEnv, interpolate } from "@mxweb/utils";

/**
 * HTTP methods supported by the Http client.
 *
 * @since 0.0.1
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

/**
 * Valid query parameter types for HTTP requests.
 * Can be a string, object with primitive values, array of key-value tuples, or URLSearchParams.
 *
 * @since 0.0.1
 */
export type HttpQuery =
  | string
  | Record<string, string | number | boolean | undefined>
  | Array<[string, string | number | boolean | undefined]>
  | URLSearchParams;

/**
 * Configuration options for an HTTP request.
 *
 * @template Body - The type of the request body
 * @template Params - The type of URL path parameters (used for interpolation)
 * @template Query - The type of query string parameters
 * @template Headers - The type of request headers
 *
 * @since 0.0.1
 */
export interface HttpRequest<
  Body = unknown,
  Params = Record<string, unknown>,
  Query = HttpQuery,
  Headers = Record<string, string>,
> {
  method: HttpMethod;
  url: string;
  headers?: Headers;
  body?: Body;
  query?: Query;
  params?: Params;
  signal?: AbortSignal;
}

/**
 * Interface for storage implementations (localStorage, sessionStorage, cookies, etc.)
 * used for persisting authentication tokens.
 *
 * @since 0.0.1
 */
export interface HttpStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string, options?: any): void;
}

/**
 * Interceptor function that modifies HTTP requests before they are sent.
 *
 * @since 0.0.1
 */
export type HttpInterceptorRequest = (options: HttpRequest) => Promise<HttpRequest> | HttpRequest;

/**
 * Interceptor function that processes HTTP responses before they are returned.
 *
 * @since 0.0.1
 */
export type HttpInterceptorResponse = (response: Response) => Promise<Response> | Response;

export type HttpInterceptorTransform = (data: any) => Promise<any> | any;

/**
 * Interceptor function that handles errors during HTTP requests.
 *
 * @since 0.0.1
 */
export type HttpInterceptorError = (error: unknown) => Promise<any> | any;

/**
 * Parameters for registering HTTP interceptors.
 *
 * @since 0.0.1
 */
export type HttpInterceptorParameters =
  | ["request", HttpInterceptorRequest]
  | ["response", HttpInterceptorResponse]
  | ["transform", HttpInterceptorTransform]
  | ["error", HttpInterceptorError];

/**
 * Standardized HTTP response structure.
 *
 * @template T - The type of successful response data
 * @template E - The type of error response data
 *
 * @since 0.0.1
 */
export interface HttpResponse<T = unknown, E = unknown> {
  success: boolean;
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  error: E | null;
}

/**
 * Progress information for file uploads.
 *
 * @since 0.0.1
 */
export interface HttpProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Configuration options for file upload requests.
 *
 * @since 0.0.1
 */
export interface HttpUploadOptions extends Pick<
  HttpRequest,
  "headers" | "params" | "signal" | "query"
> {
  onProgress?: (progress: HttpProgress) => void;
  name: string;
  body?: Record<string, unknown>;
}

/**
 * Configuration options for creating factory HTTP client functions.
 *
 * @since 0.0.1
 */
export interface HttpFactoryOptions {
  baseURL?: string;
  http?: Http;
  storage?: HttpStorage | (() => Promise<HttpStorage> | HttpStorage);
  endpoint?: Record<string, unknown> | (() => Record<string, unknown>);
}

/**
 * Factory-generated HTTP client function with key and type-safe request function.
 *
 * @template T - The type of successful response data
 * @template Args - The types of function arguments
 * @template E - The type of error response data
 *
 * @since 0.0.1
 */
export interface HttpFactory<T = unknown, Args extends any[] = [], E = unknown> {
  key: string;
  fn: (...args: Args) => Promise<HttpResponse<T, E>>;
}

/**
 * HTTP client class for making API requests with support for interceptors,
 * authentication, and various request configurations.
 *
 * Features:
 * - Automatic authentication token management
 * - Request/response/error interceptors
 * - URL interpolation with parameters
 * - File upload with progress tracking
 * - Framework-agnostic storage support
 * - Type-safe responses
 *
 * @example
 * ```typescript
 * // Basic usage
 * const http = new Http('https://api.example.com');
 *
 * // GET request
 * const response = await http.get<User>('/users/123');
 *
 * // POST request
 * const createResponse = await http.post<User>('/users', { name: 'John' });
 *
 * // Upload with progress
 * const file = document.querySelector('input[type="file"]').files[0];
 * await http.upload('/upload', file, {
 *   name: 'document',
 *   onProgress: (progress) => console.log(`${progress.percentage}%`)
 * });
 *
 * // Add interceptors
 * http.on('request', async (options) => {
 *   console.log('Making request:', options.url);
 *   return options;
 * });
 * ```
 *
 * @since 0.0.1
 */
export class Http {
  static readonly method = HttpMethod;
  /** Storage key for authentication token *
   * @since 0.0.1
   */
  static authTokenKey = "access_token";
  /** Header key for authentication *
   * @since 0.0.1
   */
  static authHeaderKey = "Authorization";
  /** Authentication header type/prefix (e.g., "Bearer") *
   * @since 0.0.1
   */
  static authHeaderType = "Bearer";

  /** Storage locations to check for authentication token *
   * @since 0.0.1
   */
  static authDetectToken = ["localStorage", "sessionStorage", "cookie"];

  /** Extra headers to be added to all requests *
   * @since 0.0.1
   */
  static extraHeaders: Record<string, string> | null = null;
  /** Static storage instance *
   * @since 0.0.1
   */
  static storage: HttpStorage | null = null;

  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  readonly method = Http.method;
  private storage: HttpStorage | null = Http.storage;

  private static interceptors = {
    request: [] as HttpInterceptorRequest[],
    response: [] as HttpInterceptorResponse[],
    transform: [] as HttpInterceptorTransform[],
    error: [] as HttpInterceptorError[],
  };

  private interceptors = {
    request: [] as HttpInterceptorRequest[],
    response: [] as HttpInterceptorResponse[],
    transform: [] as HttpInterceptorTransform[],
    error: [] as HttpInterceptorError[],
  };

  /**
   * Creates a new Http client instance.
   *
   * @param baseURL - The base URL for all requests. Defaults to API_URL environment variable or "/".
   *
   * @since 0.0.1
   */
  constructor(private readonly baseURL = getEnv("API_URL", "/")) {}

  /**
   * Registers a static interceptor for all Http instances.
   *
   * @param params - Tuple of interceptor type and handler function
   *
   * @since 0.0.1
   */
  static on(...params: HttpInterceptorParameters) {
    const [type, handler] = params;
    const registered = Http.interceptors[type] as unknown[];
    registered.includes(handler) || registered.push(handler);
    Http.interceptors[type] = registered as Array<any>;
  }

  /**
   * Removes a static interceptor from all Http instances.
   *
   * @param params - Tuple of interceptor type and handler function
   *
   * @since 0.0.1
   */
  static off(...params: HttpInterceptorParameters) {
    const [type, handler] = params;
    const registered = Http.interceptors[type] as unknown[];
    Http.interceptors[type] = registered.filter((h) => h !== handler) as Array<any>;
  }

  /**
   * Sets the storage implementation for this Http instance.
   *
   * @param storage - Storage implementation for persisting authentication tokens
   *
   * @since 0.0.1
   */
  setStorage(storage: HttpStorage) {
    this.storage = storage;
  }

  /**
   * Validates if a value is a valid HTTP query type.
   *
   * @param query - The value to validate
   * @returns True if the value is a valid HttpQuery type
   *
   * @since 0.0.1
   */
  isValidQuery(query: unknown): query is HttpQuery {
    if (typeof query === "string" || query instanceof URLSearchParams) {
      return true;
    }

    if (Array.isArray(query)) {
      return query.every(
        (item) =>
          Array.isArray(item) &&
          item.length === 2 &&
          typeof item[0] === "string" &&
          (typeof item[1] === "string" ||
            typeof item[1] === "number" ||
            typeof item[1] === "boolean" ||
            typeof item[1] === "undefined")
      );
    }

    if (typeof query === "object" && query !== null) {
      return Object.values(query).every(
        (value) =>
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          typeof value === "undefined"
      );
    }

    return false;
  }

  /**
   * Constructs a query string from request options.
   *
   * @param options - The HTTP request options
   * @returns The constructed query string
   *
   * @since 0.0.1
   */
  getQuery<Params extends Record<string, unknown>>(options: HttpRequest<unknown, Params>): string {
    const { method, body, query } = options;

    const cleanParams = (params: unknown): Record<string, string> => {
      if (!params || typeof params !== "object") {
        return {};
      }

      const result: Record<string, string> = {};

      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          result[key] = String(value);
        }
      }

      return result;
    };

    let queryString = new URLSearchParams(cleanParams(query)).toString();

    if (method === HttpMethod.GET && this.isValidQuery(body)) {
      queryString = new URLSearchParams(cleanParams(body)).toString();
    }

    return queryString;
  }

  /**
   * Checks if a body is FormData.
   *
   * @param body - The body to check
   * @returns True if the body is FormData
   *
   * @since 0.0.1
   */
  isFormData(body: unknown): body is FormData {
    return body instanceof FormData;
  }

  /**
   * Adds headers to the default headers for this instance.
   *
   * @param headers - Headers to add
   *
   * @since 0.0.1
   */
  addHeaders(headers: Record<string, string>) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };
  }

  /**
   * Registers an interceptor for this Http instance.
   *
   * @param params - Tuple of interceptor type and handler function
   * @returns This Http instance for method chaining
   *
   * @since 0.0.1
   */
  on(...params: HttpInterceptorParameters) {
    const [type, handler] = params;
    const registered = this.interceptors[type] as unknown[];
    registered.includes(handler) || registered.push(handler);
    this.interceptors[type] = registered as Array<any>;
    return this;
  }

  /**
   * Removes an interceptor from this Http instance.
   *
   * @param params - Tuple of interceptor type and handler function
   * @returns This Http instance for method chaining
   *
   * @since 0.0.1
   */
  off(...params: HttpInterceptorParameters) {
    const [type, handler] = params;
    const registered = this.interceptors[type] as unknown[];
    this.interceptors[type] = registered.filter((h) => h !== handler) as Array<any>;
    return this;
  }

  /**
   * Retrieves the authentication token from storage and formats it for the Authorization header.
   *
   * @returns Object with header key and formatted token value
   *
   * @since 0.0.1
   */
  getToken() {
    const authTokenKey = getEnv("API_AUTH_TOKEN_KEY", Http.authTokenKey)?.trim();
    const authHeaderKey = getEnv("API_AUTH_HEADER_KEY", Http.authHeaderKey)?.trim();
    const authHeaderType = getEnv("API_AUTH_HEADER_TYPE", Http.authHeaderType)?.trim();

    if (!authTokenKey || !authHeaderKey) {
      return {
        key: authHeaderKey,
        value: "",
      };
    }

    let token = "";

    if (this.storage) {
      token = this.storage.getItem(authTokenKey) || "";
    }

    const result = {
      key: authHeaderKey,
      value: "",
    };

    if (token) {
      result.value = token;

      if (authHeaderType) {
        result.value = `${authHeaderType} ${token}`;
      }
    }

    return result;
  }

  /**
   * Constructs headers for a request including authentication and content type.
   *
   * @param headers - Custom headers to include
   * @param isFormData - Whether the request body is FormData
   * @returns Complete headers object
   *
   * @since 0.0.1
   */
  getHeaders(headers: Record<string, string> = {}, isFormData?: boolean) {
    const token = this.getToken();

    if (!(token.key in headers) || !headers[token.key]) {
      headers[token.key] = token.value;
    }

    if (isFormData && "Content-Type" in headers) {
      delete headers["Content-Type"];
    } else {
      headers["Content-Type"] =
        headers["Content-Type"] || this.defaultHeaders["Content-Type"] || "application/json";
    }

    const result = {
      ...this.defaultHeaders,
      ...headers,
      ...(Http.extraHeaders || {}),
    };

    Http.extraHeaders = null;
    return result;
  }

  /**
   * Constructs the full URL for a request including base URL, path params, and query string.
   *
   * @param options - The HTTP request options
   * @returns The complete URL string
   *
   * @since 0.0.1
   */
  getURL(options: HttpRequest): string {
    const { url, params = {} } = options;
    const queryString = this.getQuery(options);

    let finalURL = url;

    if (url) {
      if (url.match(/^https?:\/\//)) {
        finalURL = url;
      } else {
        const baseURL = this.baseURL.replace(/\/+$/, "");
        const cleanURL = url.replace(/^\/+/, "");
        finalURL = `${baseURL}/${cleanURL}`;
      }
    }

    if (queryString) {
      const separator = finalURL.includes("?") ? "&" : "?";
      finalURL += `${separator}${queryString}`;
    }

    return interpolate(finalURL, params);
  }

  /**
   * Prepares the request body based on the HTTP method and body type.
   *
   * @param options - The HTTP request options
   * @returns The prepared body or undefined
   *
   * @since 0.0.1
   */
  getBody(options: HttpRequest) {
    const { method, body } = options;

    if (
      method === HttpMethod.GET ||
      method === HttpMethod.HEAD ||
      method === HttpMethod.OPTIONS ||
      method === HttpMethod.DELETE
    ) {
      return undefined;
    }

    if (
      (method === HttpMethod.POST || method === HttpMethod.PUT || method === HttpMethod.PATCH) &&
      this.isFormData(body)
    ) {
      return body;
    }

    return body !== undefined ? JSON.stringify(body) : undefined;
  }

  /**
   * Makes an HTTP request with the specified options.
   *
   * @template T - The type of successful response data
   * @template E - The type of error response data
   * @param options - The HTTP request options
   * @returns Promise resolving to standardized HTTP response
   *
   * @since 0.0.1
   */
  async request<T = unknown, E = unknown>(options: HttpRequest): Promise<HttpResponse<T, E>> {
    const { method = HttpMethod.GET } = options;

    try {
      let modifiedOptions = { ...options };
      const allReqInterceptors = [...Http.interceptors.request, ...this.interceptors.request];

      for (const interceptor of allReqInterceptors) {
        modifiedOptions = await interceptor(modifiedOptions);
      }

      const fullURL = this.getURL(modifiedOptions);
      const requestHeaders = this.getHeaders(modifiedOptions.headers || {});

      if (this.isFormData(modifiedOptions.body) && "Content-Type" in requestHeaders) {
        delete requestHeaders["Content-Type"];
      }

      const response = await fetch(fullURL, {
        method: modifiedOptions.method || method,
        headers: requestHeaders,
        body: this.getBody(modifiedOptions),
        signal: modifiedOptions.signal,
      });

      let data: T;
      const headers = response.headers;
      const contentType = headers.get("Content-Type") || "";

      if (contentType.includes("application/json")) {
        data = (await response.json()) as unknown as T;
      } else {
        data = (await response.text()) as unknown as T;
      }

      const allTransformInterceptors = [
        ...Http.interceptors.transform,
        ...this.interceptors.transform,
      ];

      for (const transform of allTransformInterceptors) {
        data = await transform(data);
      }

      const allResInterceptors = [...Http.interceptors.response, ...this.interceptors.response];

      let modifiedResponse: Response = response;

      for (const interceptor of allResInterceptors) {
        modifiedResponse = await interceptor(modifiedResponse);
      }

      const resultHeaders: Record<string, string> = {};
      modifiedResponse.headers.forEach((value, key) => {
        resultHeaders[key] = value;
      });

      const success = modifiedResponse.ok;

      return {
        data,
        success,
        error: success ? null : (data as unknown as E),
        status: modifiedResponse.status,
        statusText: modifiedResponse.statusText,
        headers: resultHeaders,
      };
    } catch (error) {
      const allInterceptors = [...Http.interceptors.error, ...this.interceptors.error];
      for (const errorHandler of allInterceptors) {
        await errorHandler(error);
      }
      return {
        data: null as unknown as T,
        status: 0,
        statusText: "Error",
        headers: {},
        error: error as E,
        success: false,
      };
    }
  }

  /**
   * Makes a GET request.
   *
   * @template T - The type of successful response data
   * @template Query - The type of query parameters
   * @template E - The type of error response data
   * @param url - The request URL
   * @param query - Query parameters
   * @param options - Additional request options
   * @returns Promise resolving to HTTP response
   *
   * @since 0.0.1
   */
  get<T = unknown, Query = Record<string, unknown>, E = unknown>(
    url: string,
    query?: Query,
    options?: Pick<HttpRequest, "headers" | "params" | "signal">
  ): Promise<HttpResponse<T, E>> {
    return this.request<T, E>({
      ...options,
      method: HttpMethod.GET,
      url,
      query: query as HttpQuery,
    });
  }

  /**
   * Makes a POST request.
   *
   * @template T - The type of successful response data
   * @template Body - The type of request body
   * @template E - The type of error response data
   * @param url - The request URL
   * @param body - The request body
   * @param options - Additional request options
   * @returns Promise resolving to HTTP response
   *
   * @since 0.0.1
   */
  post<T = unknown, Body = unknown, E = unknown>(
    url: string,
    body?: Body,
    options?: Pick<HttpRequest, "headers" | "params" | "signal" | "query">
  ): Promise<HttpResponse<T, E>> {
    return this.request<T, E>({
      ...options,
      method: HttpMethod.POST,
      url,
      body,
    });
  }

  /**
   * Makes a PUT request.
   *
   * @template T - The type of successful response data
   * @template Body - The type of request body
   * @template E - The type of error response data
   * @param url - The request URL
   * @param body - The request body
   * @param options - Additional request options
   * @returns Promise resolving to HTTP response
   *
   * @since 0.0.1
   */
  put<T = unknown, Body = unknown, E = unknown>(
    url: string,
    body?: Body,
    options?: Pick<HttpRequest, "headers" | "params" | "signal" | "query">
  ): Promise<HttpResponse<T, E>> {
    return this.request<T, E>({
      ...options,
      method: HttpMethod.PUT,
      url,
      body,
    });
  }

  /**
   * Makes a PATCH request.
   *
   * @template T - The type of successful response data
   * @template Body - The type of request body
   * @template E - The type of error response data
   * @param url - The request URL
   * @param body - The request body
   * @param options - Additional request options
   * @returns Promise resolving to HTTP response
   *
   * @since 0.0.1
   */
  patch<T = unknown, Body = unknown, E = unknown>(
    url: string,
    body?: Body,
    options?: Pick<HttpRequest, "headers" | "params" | "signal" | "query">
  ): Promise<HttpResponse<T, E>> {
    return this.request<T, E>({
      ...options,
      method: HttpMethod.PATCH,
      url,
      body,
    });
  }

  /**
   * Makes a DELETE request.
   *
   * @template T - The type of successful response data
   * @template E - The type of error response data
   * @param url - The request URL
   * @param options - Additional request options
   * @returns Promise resolving to HTTP response
   *
   * @since 0.0.1
   */
  delete<T = unknown, E = unknown>(
    url: string,
    options?: Pick<HttpRequest, "headers" | "params" | "signal" | "query">
  ): Promise<HttpResponse<T, E>> {
    return this.request<T, E>({
      ...options,
      method: HttpMethod.DELETE,
      url,
    });
  }

  /**
   * Makes a HEAD request.
   *
   * @template T - The type of successful response data
   * @template E - The type of error response data
   * @param url - The request URL
   * @param options - Additional request options
   * @returns Promise resolving to HTTP response
   *
   * @since 0.0.1
   */
  head<T = unknown, E = unknown>(
    url: string,
    options?: Pick<HttpRequest, "headers" | "params" | "signal" | "query">
  ): Promise<HttpResponse<T, E>> {
    return this.request<T, E>({
      ...options,
      method: HttpMethod.HEAD,
      url,
    });
  }

  /**
   * Makes an OPTIONS request.
   *
   * @template T - The type of successful response data
   * @template E - The type of error response data
   * @param url - The request URL
   * @param options - Additional request options
   * @returns Promise resolving to HTTP response
   *
   * @since 0.0.1
   */
  options<T = unknown, E = unknown>(
    url: string,
    options?: Pick<HttpRequest, "headers" | "params" | "signal" | "query">
  ): Promise<HttpResponse<T, E>> {
    return this.request<T, E>({
      ...options,
      method: HttpMethod.OPTIONS,
      url,
    });
  }

  /**
   * Uploads one or more files with optional progress tracking.
   *
   * @template T - The type of successful response data
   * @template E - The type of error response data
   * @param url - The upload URL
   * @param file - File(s) to upload (single File, File array, or FileList)
   * @param options - Upload options including progress callback and form field name
   * @returns Promise resolving to HTTP response
   *
   * @example
   * ```typescript
   * // Single file upload
   * const file = input.files[0];
   * await http.upload('/upload', file, {
   *   name: 'document',
   *   onProgress: (p) => console.log(`${p.percentage}%`)
   * });
   *
   * // Multiple files
   * await http.upload('/upload', input.files, {
   *   name: 'files[]',
   *   body: { userId: 123 }
   * });
   * ```
   *
   * @since 0.0.1
   */
  upload<T = unknown, E = unknown>(
    url: string,
    file: File | File[] | FileList,
    options?: HttpUploadOptions
  ) {
    const formData = new FormData();

    let fileName = options?.name || "file";

    if (Array.isArray(file)) {
      if (fileName.endsWith("[]")) {
        fileName = fileName.slice(0, -2);
      }

      file.forEach((f, index) => {
        formData.append(`${fileName}[${index}]`, f, f.name);
      });
    } else if (file instanceof FileList) {
      if (fileName.endsWith("[]")) {
        fileName = fileName.slice(0, -2);
      }

      Array.from(file).forEach((f, index) => {
        formData.append(`${fileName}[${index}]`, f, f.name);
      });
    } else {
      formData.append(fileName, file, file.name);
    }

    if (options?.body) {
      const flattenedBody = flatten(options.body);

      Object.entries(flattenedBody).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }

    if (options?.onProgress && typeof XMLHttpRequest !== "undefined") {
      return new Promise<HttpResponse<T, E>>(async (resolve) => {
        try {
          let requestOptions: HttpRequest = {
            ...options,
            method: HttpMethod.POST,
            url,
            body: formData,
          };

          const allReqInterceptors = [...Http.interceptors.request, ...this.interceptors.request];

          for (const interceptor of allReqInterceptors) {
            requestOptions = await interceptor(requestOptions);
          }

          const fullURL = this.getURL(requestOptions);
          const requestHeaders = this.getHeaders(requestOptions.headers || {}, true);

          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);

              options.onProgress?.({
                loaded: event.loaded,
                total: event.total,
                percentage,
              });
            }
          });

          xhr.addEventListener("load", async () => {
            try {
              let data: T;
              const contentType = xhr.getResponseHeader("Content-Type") || "";

              if (contentType.includes("application/json")) {
                data = JSON.parse(xhr.responseText) as T;
              } else {
                data = xhr.responseText as unknown as T;
              }

              const allResInterceptors = [
                ...Http.interceptors.response,
                ...this.interceptors.response,
              ];

              let modifiedResponse: Response = new Response(xhr.responseText, {
                status: xhr.status,
                statusText: xhr.statusText,
                headers: requestHeaders,
              });

              for (const interceptor of allResInterceptors) {
                modifiedResponse = await interceptor(modifiedResponse);
              }

              const resultHeaders: Record<string, string> = {};
              modifiedResponse.headers.forEach((value, key) => {
                resultHeaders[key] = value;
              });

              const success = modifiedResponse.ok;

              resolve({
                data,
                success,
                error: success ? null : (data as unknown as E),
                status: modifiedResponse.status,
                statusText: modifiedResponse.statusText,
                headers: resultHeaders,
              });
            } catch (error) {
              const allInterceptors = [...Http.interceptors.error, ...this.interceptors.error];
              for (const errorHandler of allInterceptors) {
                errorHandler(error);
              }
              resolve({
                data: null as unknown as T,
                status: 0,
                statusText: "Error",
                headers: {},
                error: error as E,
                success: false,
              });
            }
          });

          xhr.addEventListener("error", (error) => {
            const allInterceptors = [...Http.interceptors.error, ...this.interceptors.error];
            for (const errorHandler of allInterceptors) {
              errorHandler(error);
            }
            resolve({
              data: null as unknown as T,
              status: 0,
              statusText: "Error",
              headers: {},
              error: error as E,
              success: false,
            });
          });

          xhr.addEventListener("abort", () => {
            resolve({
              data: null as unknown as T,
              status: 0,
              statusText: "Aborted",
              headers: {},
              error: null,
              success: false,
            });
          });

          xhr.open(requestOptions.method || HttpMethod.POST, fullURL, true);

          Object.entries(requestHeaders).forEach(([key, value]) => {
            if (key?.toLowerCase() !== "content-type" && value) {
              xhr.setRequestHeader(key, value);
            }
          });

          xhr.send(requestOptions.body as Document | XMLHttpRequestBodyInit | null);
        } catch (error) {
          const allInterceptors = [...Http.interceptors.error, ...this.interceptors.error];
          for (const errorHandler of allInterceptors) {
            errorHandler(error);
          }
          resolve({
            data: null as unknown as T,
            status: 0,
            statusText: "Error",
            headers: {},
            error: error as E,
            success: false,
          });
        }
      });
    }

    return this.request<T, E>({
      method: HttpMethod.POST,
      url,
      body: formData,
      headers: options?.headers,
      params: options?.params,
      signal: options?.signal,
      query: options?.query,
    });
  }

  /**
   * Creates a factory function for generating type-safe API endpoint functions.
   *
   * This static method creates an "factory" function that can generate strongly-typed
   * API client functions from a flat endpoint configuration object.
   *
   * @param options - Configuration options including baseURL, http instance, storage, and endpoint definitions
   * @returns An factory function that creates type-safe API endpoint functions
   *
   * @example
   * ```typescript
   * // Define endpoints
   * const endpoints = {
   *   'user.list': '/api/users',
   *   'user.get': '/api/users/{id}',
   *   'user.create': '/api/users',
   * };
   *
   * // Create factory function
   * const factory = Http.createFactory({
   *   baseURL: 'https://api.example.com',
   *   endpoint: endpoints,
   * });
   *
   * // Generate API functions
   * const getUsers = factory<User[]>('user.list', HttpMethod.GET);
   * const createUser = factory<User, [UserInput]>('user.create', HttpMethod.POST);
   *
   * // Use the generated functions
   * const { data: users } = await getUsers.fn();
   * const { data: newUser } = await createUser.fn({ name: 'John' });
   * ```
   *
   * @since 0.0.1
   */
  static createFactory(options: HttpFactoryOptions = {}) {
    const instance = options.http || new Http(options.baseURL);

    const getEndpoints = () => {
      if (typeof options.endpoint === "function") {
        return options.endpoint();
      } else {
        return options.endpoint || {};
      }
    };

    return function factory<T, Args extends any[] = [], E = unknown>(
      key: string,
      method?: HttpMethod | "UPLOAD"
    ): HttpFactory<T, Args, E> {
      const urls = flatten(getEndpoints()) as Record<string, string>;
      const url = urls[key] as string;

      return {
        key,
        fn: async (...args: Args) => {
          const storage =
            typeof options.storage === "function" ? await options.storage() : options.storage;

          storage && instance.setStorage(storage);

          switch (method) {
            case HttpMethod.POST:
              return await instance.post<T, Args[0], E>(url, ...args);
            case HttpMethod.PUT:
              return await instance.put<T, Args[0], E>(url, ...args);
            case HttpMethod.PATCH:
              return await instance.patch<T, Args[0], E>(url, ...args);
            case HttpMethod.DELETE:
              return await instance.delete<T, E>(url, ...args);
            case HttpMethod.HEAD:
              return await instance.head<T, E>(url, ...args);
            case HttpMethod.OPTIONS:
              return await instance.options<T, E>(url, ...args);
            case "UPLOAD":
              return await instance.upload<T, E>(
                url,
                ...(args as unknown as [File | File[] | FileList, HttpUploadOptions | undefined])
              );
            default:
              return await instance.get<T, Args[0], E>(url, ...args);
          }
        },
      };
    };
  }
}
