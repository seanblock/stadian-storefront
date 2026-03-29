import { StadianClient } from "@stadian/storefront-sdk";

let client: StadianClient | null = null;

export function getStadianClient(): StadianClient {
  if (!client) {
    const apiKey = process.env.STADIAN_API_KEY;
    const baseUrl = process.env.STADIAN_API_URL;
    if (!apiKey || !baseUrl) {
      throw new Error(
        "Missing STADIAN_API_KEY or STADIAN_API_URL environment variables"
      );
    }
    client = new StadianClient({ apiKey, baseUrl });
  }
  return client;
}
