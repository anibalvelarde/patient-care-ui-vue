// services/HttpClientBase.ts
export abstract class HttpClientBase {
    protected baseUrl: string;
    private proxyUrl: string;
  
    constructor() {
      this.baseUrl = this.getBaseUrlFromConfig();
      this.proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    }
  
    protected getBaseUrlFromConfig(): string {
      // Read the base URL from a config file or environment variable
      return "http://neurocorp.k8s:32698";
      //return "http://localhost:5245";
    }
  
    protected async get<T>(url: string): Promise<T> {
      // const fullUrl = this.proxyUrl + this.baseUrl + url;
      const fullUrl = this.baseUrl + url;
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "origin": this.getBaseUrlFromConfig(), // or the appropriate origin
          "x-requested-with": "XMLHttpRequest"
        }
      });
      if (!response.ok) {
        throw new Error("An unexpected error occurred while fetching data.");
      }
      return response.json();
    }
  
    // Add other HTTP methods (POST, PUT, DELETE) as needed
  }
  