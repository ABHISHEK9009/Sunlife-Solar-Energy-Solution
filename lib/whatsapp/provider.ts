/**
 * WhatsApp Provider Interface & Implementation — Sunlife Solar CRM
 * 
 * Provides an abstract gateway interface decoupling Sunlife CRM from any
 * underlying gateway implementation (e.g. Baileys Microservice, Meta Cloud API).
 * The CRM interacts only with this interface and never directly with sockets or sessions.
 */

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

export interface GatewayStatus {
  status: "CONNECTED" | "QR_READY" | "DISCONNECTED" | "CONNECTING" | "OFFLINE";
  isConnected: boolean;
  phone: string | null;
  name: string | null;
  hasQr: boolean;
  error?: string;
}

export interface QrResult {
  status: string;
  qr?: string;
  raw?: string;
  message?: string;
}

export interface WhatsAppProvider {
  sendText(phone: string, text: string): Promise<SendResult>;
  sendMedia(params: {
    phone: string;
    mediaUrl: string;
    caption?: string;
    fileName?: string;
    mimeType?: string;
  }): Promise<SendResult>;
  sendDocument(params: {
    phone: string;
    documentUrl: string;
    fileName?: string;
    mimeType?: string;
    caption?: string;
  }): Promise<SendResult>;
  getStatus(): Promise<GatewayStatus>;
  getQrCode(): Promise<QrResult>;
  logout(): Promise<{ success: boolean; message?: string }>;
}

export class HttpGatewayProvider implements WhatsAppProvider {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = (process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001").replace(/\/$/, "");
    this.apiKey = process.env.WHATSAPP_API_KEY || "sunlife_whatsapp_secret_key_2026";
    this.timeoutMs = 15000;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Gateway returned HTTP ${response.status}`);
      }
      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async sendText(phone: string, text: string): Promise<SendResult> {
    try {
      const result = await this.request<{ success: boolean; messageId?: string }>(
        "/send-message",
        {
          method: "POST",
          body: JSON.stringify({ phone, message: text }),
        }
      );
      return { success: true, messageId: result.messageId };
    } catch (err: any) {
      return {
        success: false,
        error: err.name === "AbortError" ? "Gateway timeout" : err.message || "Failed to send message",
      };
    }
  }

  async sendMedia(params: {
    phone: string;
    mediaUrl: string;
    caption?: string;
    fileName?: string;
    mimeType?: string;
  }): Promise<SendResult> {
    try {
      const result = await this.request<{ success: boolean; messageId?: string }>(
        "/send-media",
        {
          method: "POST",
          body: JSON.stringify(params),
        }
      );
      return { success: true, messageId: result.messageId };
    } catch (err: any) {
      return {
        success: false,
        error: err.name === "AbortError" ? "Gateway timeout" : err.message || "Failed to send media",
      };
    }
  }

  async sendDocument(params: {
    phone: string;
    documentUrl: string;
    fileName?: string;
    mimeType?: string;
    caption?: string;
  }): Promise<SendResult> {
    try {
      const result = await this.request<{ success: boolean; messageId?: string }>(
        "/send-document",
        {
          method: "POST",
          body: JSON.stringify(params),
        }
      );
      return { success: true, messageId: result.messageId };
    } catch (err: any) {
      return {
        success: false,
        error: err.name === "AbortError" ? "Gateway timeout" : err.message || "Failed to send document",
      };
    }
  }

  async getStatus(): Promise<GatewayStatus> {
    try {
      const result = await this.request<GatewayStatus>("/status", { method: "GET" });
      return result;
    } catch (err: any) {
      return {
        status: "OFFLINE",
        isConnected: false,
        phone: null,
        name: null,
        hasQr: false,
        error: err.message || "Gateway offline or unreachable",
      };
    }
  }

  async getQrCode(): Promise<QrResult> {
    try {
      const result = await this.request<QrResult>("/qr", { method: "GET" });
      return result;
    } catch (err: any) {
      return {
        status: "OFFLINE",
        message: err.message || "Could not retrieve QR code. Gateway is offline.",
      };
    }
  }

  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.request<{ success: boolean; message?: string }>("/logout", {
        method: "POST",
      });
      return result;
    } catch (err: any) {
      return { success: false, message: err.message || "Logout failed" };
    }
  }
}

// Singleton factory
let providerInstance: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!providerInstance) {
    providerInstance = new HttpGatewayProvider();
  }
  return providerInstance;
}
