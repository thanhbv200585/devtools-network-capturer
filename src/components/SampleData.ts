import { HAREntry } from "../types";

export const sampleHAREntries: HAREntry[] = [
  {
    _id: "sample-1",
    startedDateTime: new Date(Date.now() - 3000000).toISOString(),
    time: 142,
    request: {
      method: "GET",
      url: "https://api.stripe.com/v1/customers?limit=3&created=gte_1710000000",
      httpVersion: "HTTP/2",
      headers: [
        { name: "Authorization", value: "Bearer sk_test_51Nz8V..." },
        { name: "Accept", value: "application/json" },
        { name: "Stripe-Version", value: "2023-10-16" },
        { name: "User-Agent", value: "stripe-node/13.7.0" }
      ],
      queryString: [
        { name: "limit", value: "3" },
        { name: "created", value: "gte_1710000000" }
      ]
    },
    response: {
      status: 200,
      statusText: "OK",
      headers: [
        { name: "Content-Type", value: "application/json; charset=utf-8" },
        { name: "Cache-Control", value: "no-cache, no-store, private" },
        { name: "Stripe-Should-Retry", value: "false" }
      ],
      content: {
        mimeType: "application/json",
        text: JSON.stringify({
          object: "list",
          data: [
            {
              id: "cus_Pk9jRzO1rZ",
              object: "customer",
              email: "alex.jones@example.com",
              name: "Alex Jones",
              currency: "usd",
              metadata: { source: "DevTools Export App" }
            },
            {
              id: "cus_Pk9kTeW2xK",
              object: "customer",
              email: "sara.smith@example.com",
              name: "Sara Smith",
              currency: "eur",
              metadata: { loyalty: "vip" }
            }
          ],
          has_more: false
        }, null, 2)
      }
    }
  },
  {
    _id: "sample-2",
    startedDateTime: new Date(Date.now() - 2500000).toISOString(),
    time: 289,
    request: {
      method: "POST",
      url: "https://api.supabase.co/v1/auth/token?grant_type=password",
      httpVersion: "HTTP/2",
      headers: [
        { name: "Content-Type", value: "application/json" },
        { name: "apikey", value: "sb_anon_key_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" },
        { name: "Accept", value: "application/json" }
      ],
      queryString: [
        { name: "grant_type", value: "password" }
      ],
      postData: {
        mimeType: "application/json",
        text: JSON.stringify({
          email: "developer@aistudio.build",
          password: "super_secure_secret_password"
        }, null, 2)
      }
    },
    response: {
      status: 201,
      statusText: "Created",
      headers: [
        { name: "Content-Type", value: "application/json; charset=utf-8" },
        { name: "X-Content-Type-Options", value: "nosniff" }
      ],
      content: {
        mimeType: "application/json",
        text: JSON.stringify({
          access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
          token_type: "bearer",
          expires_in: 3600,
          user: {
            id: "u_f7e911c4",
            email: "developer@aistudio.build",
            role: "authenticated"
          }
        }, null, 2)
      }
    }
  },
  {
    _id: "sample-3",
    startedDateTime: new Date(Date.now() - 1800000).toISOString(),
    time: 512,
    request: {
      method: "POST",
      url: "https://github.com/login/oauth/access_token",
      httpVersion: "HTTP/1.1",
      headers: [
        { name: "Accept", value: "application/json" },
        { name: "Content-Type", value: "application/x-www-form-urlencoded" }
      ],
      queryString: [],
      postData: {
        mimeType: "application/x-www-form-urlencoded",
        text: "client_id=github_client_112&client_secret=git_sec_8849&code=gho_auth_991823&redirect_uri=https%3A%2F%2Fais-dev.run.app"
      }
    },
    response: {
      status: 200,
      statusText: "OK",
      headers: [
        { name: "Content-Type", value: "application/json; charset=utf-8" },
        { name: "Server", value: "GitHub.com" }
      ],
      content: {
        mimeType: "application/json",
        text: JSON.stringify({
          access_token: "gho_1234567890abcdefghijklmnopqrstuvwxyz",
          scope: "repo,user",
          token_type: "bearer"
        }, null, 2)
      }
    }
  },
  {
    _id: "sample-4",
    startedDateTime: new Date(Date.now() - 800000).toISOString(),
    time: 98,
    request: {
      method: "GET",
      url: "https://images.unsplash.com/photo-1542125387-a2f0249c12df?w=200&auto=format&fit=crop",
      headers: [
        { name: "User-Agent", value: "Mozilla/5.0" },
        { name: "Accept", value: "image/avif,image/webp,*/*" }
      ],
      queryString: [
        { name: "w", value: "200" },
        { name: "auto", value: "format" },
        { name: "fit", value: "crop" }
      ]
    },
    response: {
      status: 200,
      statusText: "OK",
      headers: [
        { name: "Content-Type", value: "image/webp" },
        { name: "Cache-Control", value: "public, max-age=31536000" }
      ],
      content: {
        mimeType: "image/webp",
        text: "[Binary Image Content: 8412 bytes]"
      }
    }
  },
  {
    _id: "sample-5",
    startedDateTime: new Date(Date.now() - 400000).toISOString(),
    time: 19,
    request: {
      method: "PUT",
      url: "https://api.github.com/repos/octocat/hello-world/subscription",
      headers: [
        { name: "Authorization", value: "Bearer ghp_token" },
        { name: "Content-Type", value: "application/json" }
      ],
      queryString: [],
      postData: {
        mimeType: "application/json",
        text: JSON.stringify({ subscribed: true, ignored: false }, null, 2)
      }
    },
    response: {
      status: 401,
      statusText: "Unauthorized",
      headers: [
        { name: "Content-Type", value: "application/json; charset=utf-8" }
      ],
      content: {
        mimeType: "application/json",
        text: JSON.stringify({
          message: "Requires authentication",
          documentation_url: "https://docs.github.com/rest/reference/activity#set-a-repository-subscription"
        }, null, 2)
      }
    }
  }
];
