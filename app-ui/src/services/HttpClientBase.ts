// services/HttpClientBase.ts
export abstract class HttpClientBase {
    protected baseUrl: string;

    constructor() {
      this.baseUrl = this.getBaseUrlFromConfig();
    }
  
    protected getBaseUrlFromConfig(): string {
      const appConfig = (window as unknown as Record<string, unknown>).__APP_CONFIG__ as Record<string, string> | undefined;
      return appConfig?.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || "http://localhost:5245";
    }
  
    protected async get<T>(url: string): Promise<T> {
      const fullUrl = this.baseUrl + url;
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error("An unexpected error occurred while fetching data.");
      }
      return response.json();
    }
  
    // Add other HTTP methods (POST, PUT, DELETE) as needed
  }
  