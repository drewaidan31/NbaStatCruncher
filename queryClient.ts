import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log("Making API request to:", url);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    console.log("API response status:", res.status, "for URL:", url);

    if (res.status === 401) {
      // Check if this is a session expiration that requires re-login
      try {
        const errorData = await res.json();
        if (errorData.redirectToLogin) {
          console.log("Session expired, redirecting to login");
          window.location.href = "/api/login";
          return null;
        }
      } catch (e) {
        // If JSON parsing fails, continue with normal 401 handling
      }

      if (unauthorizedBehavior === "returnNull") {
        console.log("Returning null for 401 status");
        return null;
      }
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log("API response data:", data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
