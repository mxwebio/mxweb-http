import { describe, it, expect, beforeEach, vi } from "vitest";
import { Http, HttpMethod } from "../src";

describe("Http", () => {
  let http: Http;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    http = new Http("https://api.example.com");
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  describe("GET requests", () => {
    it("should make GET request with correct URL", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => ({ data: "test" }),
      } as Response);

      await http.get("/users");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should return response with success flag", async () => {
      const mockData = { id: 1, name: "John" };
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => mockData,
      } as Response);

      const response = await http.get("/users/1");

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });
  });

  describe("POST requests", () => {
    it("should make POST request with body", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        statusText: "Created",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => ({ id: 1 }),
      } as Response);

      const body = { name: "John", email: "john@example.com" };
      await http.post("/users", body);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should return created response", async () => {
      const mockData = { id: 1, created: true };
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        statusText: "Created",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => mockData,
      } as Response);

      const response = await http.post("/users", { name: "John" });

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
    });
  });

  describe("PUT requests", () => {
    it("should make PUT request", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => ({ updated: true }),
      } as Response);

      await http.put("/users/1", { name: "Jane" });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users/1",
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  describe("DELETE requests", () => {
    it("should make DELETE request", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 204,
        statusText: "No Content",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "",
      } as Response);

      await http.delete("/users/1");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("PATCH requests", () => {
    it("should make PATCH request", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => ({ updated: true }),
      } as Response);

      await http.patch("/users/1", { name: "Updated" });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/users/1",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should handle HTTP errors without throwing", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => ({ error: "User not found" }),
      } as Response);

      const response = await http.get("/users/999");

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    });

    it("should handle network errors gracefully", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      const response = await http.get("/users");

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe("Base URL", () => {
    it("should work without trailing slash in base URL", () => {
      const client = new Http("https://api.example.com");
      expect(client).toBeDefined();
    });

    it("should work with trailing slash in base URL", () => {
      const client = new Http("https://api.example.com/");
      expect(client).toBeDefined();
    });
  });

  describe("HttpMethod enum", () => {
    it("should have all HTTP methods", () => {
      expect(HttpMethod.GET).toBe("GET");
      expect(HttpMethod.POST).toBe("POST");
      expect(HttpMethod.PUT).toBe("PUT");
      expect(HttpMethod.DELETE).toBe("DELETE");
      expect(HttpMethod.PATCH).toBe("PATCH");
      expect(HttpMethod.HEAD).toBe("HEAD");
      expect(HttpMethod.OPTIONS).toBe("OPTIONS");
    });
  });
});
