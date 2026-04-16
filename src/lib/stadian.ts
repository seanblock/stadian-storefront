import { StadianClient, HttpClient } from "@stadian/storefront-sdk";

let client: StadianClient | null = null;
let httpClient: HttpClient | null = null;

function getConfig() {
  const apiKey = process.env.STADIAN_API_KEY;
  const baseUrl = process.env.STADIAN_API_URL;
  if (!apiKey || !baseUrl) {
    throw new Error(
      "Missing STADIAN_API_KEY or STADIAN_API_URL environment variables"
    );
  }
  return { apiKey, baseUrl };
}

export function getStadianClient(): StadianClient {
  if (!client) {
    client = new StadianClient(getConfig());
  }
  return client;
}

/** Low-level HTTP client for SDK endpoints not yet wrapped by a resource. */
export function getHttpClient(): HttpClient {
  if (!httpClient) {
    httpClient = new HttpClient(getConfig());
  }
  return httpClient;
}
