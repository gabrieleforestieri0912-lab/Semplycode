"use strict";
(() => {
  // src/lib/apiClient.ts
  function createApiClient(config = {}) {
    const resolveBase = () => {
      const base = typeof config.baseUrl === "function" ? config.baseUrl() : config.baseUrl || "";
      return base.replace(/\/$/, "");
    };
    async function fetch(path, options = {}) {
      const base = resolveBase();
      const token = config.getToken?.() || null;
      const headers = new Headers(options.headers);
      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await globalThis.fetch(`${base}${path}`, {
        ...options,
        headers,
        credentials: "include"
      });
      if (!res.ok) {
        if (res.status === 401) config.onUnauthorized?.();
        let data = null;
        try {
          data = await res.json();
        } catch {
        }
        const err = new Error(data?.error || `Errore ${res.status}`);
        err.status = res.status;
        err.code = data?.code;
        throw err;
      }
      return res;
    }
    async function json(path, options = {}) {
      const res = await fetch(path, options);
      return res.json();
    }
    const notes = {
      list: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.category) qs.set("category", params.category);
        if (params.q) qs.set("q", params.q);
        if (params.status) qs.set("status", params.status);
        if (params.due) qs.set("due", "true");
        if (params.limit) qs.set("limit", String(params.limit));
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        return json(`/api/notes${suffix}`);
      },
      create: (input) => json("/api/notes", {
        method: "POST",
        body: JSON.stringify(input)
      }),
      get: (id) => json(`/api/notes/${id}`),
      update: (id, patch) => json(`/api/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      }),
      remove: (id) => fetch(`/api/notes/${id}`, { method: "DELETE" }),
      categorize: (id) => json(`/api/notes/${id}/categorize`, { method: "POST" }),
      categorizePending: () => json("/api/notes/categorize-pending", { method: "POST" }),
      related: (id) => json(`/api/notes/${id}/related`),
      findRelated: (id) => json(`/api/notes/${id}/related`, { method: "POST" }),
      quiz: (id) => json(
        `/api/notes/${id}/quiz`,
        { method: "POST" }
      ),
      review: (id, correct) => json(`/api/notes/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ correct })
      }),
      dueReviews: (limit = 20) => json(`/api/notes/due-reviews?limit=${limit}`)
    };
    const categories = {
      list: () => json("/api/categories")
    };
    const paths = {
      list: () => json("/api/learning-paths"),
      create: (title, noteIds) => json("/api/learning-paths", {
        method: "POST",
        body: JSON.stringify({ title, noteIds })
      }),
      remove: (id) => fetch(`/api/learning-paths/${id}`, { method: "DELETE" })
    };
    const chat = {
      analyze: (messages) => json("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages, stream: false })
      })
    };
    const auth = {
      linkCode: (code) => json("/api/auth/link-code", {
        method: "POST",
        body: JSON.stringify({ code })
      })
    };
    return {
      fetch,
      json,
      notes,
      categories,
      paths,
      chat,
      auth
    };
  }
  var api = createApiClient();

  // src/lib/apiClient.extension.ts
  window.SemplycodeAPI = { createApiClient };
})();
