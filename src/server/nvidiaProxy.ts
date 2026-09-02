/**
 * VentureCue — Server-Side NVIDIA NIM Proxy Handler
 * Securely proxies LLM inference requests to NVIDIA NIM Cloud Functions.
 *
 * CRITICAL SECURITY INVARIANT:
 * The NVIDIA API key (NVIDIA_API_KEY) is accessed strictly server-side.
 * It is NEVER transmitted to the client, embedded in HTML/JS, or stored in browser state.
 */

import type { IncomingMessage, ServerResponse } from 'http';

const DEFAULT_NVIDIA_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'meta/llama-3.2-11b-vision-instruct';

export class NvidiaServerProxy {
  /**
   * Retrieves the server-side API key from process.env.
   */
  public static getServerApiKey(): string {
    return (process.env.NVIDIA_API_KEY || '').trim();
  }

  public static getServerModel(): string {
    return (process.env.NVIDIA_MODEL || DEFAULT_MODEL).trim();
  }

  public static isConfigured(): boolean {
    const key = this.getServerApiKey();
    return !!key && key.startsWith('nvapi-');
  }

  /**
   * Proxies a conversation turn request to NVIDIA NIM.
   */
  public static async proxyConversation(payload: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  }): Promise<{ ok: boolean; status: number; content?: string; error?: string }> {
    const apiKey = this.getServerApiKey();
    if (!apiKey) {
      return {
        ok: false,
        status: 503,
        error: 'NVIDIA API key not configured on server (missing NVIDIA_API_KEY).',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(DEFAULT_NVIDIA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getServerModel(),
          messages: payload.messages,
          temperature: payload.temperature ?? 0.65,
          max_tokens: payload.max_tokens ?? 130,
          top_p: payload.top_p ?? 0.9,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: `NVIDIA NIM service returned status ${response.status}.`,
        };
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content?.trim();

      return {
        ok: true,
        status: 200,
        content: content || '',
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 500,
        error: err.name === 'AbortError' ? 'NVIDIA NIM request timed out' : 'Server proxy network error',
      };
    }
  }

  /**
   * HTTP middleware handler for incoming /api/ requests in Node/Vite environments.
   */
  public static handleHttpRequest(req: IncomingMessage, res: ServerResponse, next?: () => void): void {
    const url = req.url || '';

    // 1. GET /api/status
    if (url === '/api/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          provider: 'NVIDIA NIM',
          model: this.getServerModel(),
          isConfigured: this.isConfigured(),
          configuredVia: 'Server Environment (NVIDIA_API_KEY)',
        })
      );
      return;
    }

    // 2. POST /api/conversation
    if (url === '/api/conversation' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const result = await this.proxyConversation(parsed);
          res.writeHead(result.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    // 3. POST /api/evaluation
    if (url === '/api/evaluation' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const result = await this.proxyConversation({
            messages: [{ role: 'user', content: parsed.prompt }],
            temperature: 0.3,
            max_tokens: 600,
          });
          res.writeHead(result.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    if (next) {
      next();
    }
  }
}
