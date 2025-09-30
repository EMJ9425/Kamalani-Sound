/**
 * IPC Handler for Blink Image Fetching
 * Authenticated media fetch with retry + header mode swap
 */

import { ipcMain } from 'electron';
import * as https from 'https';
import * as http from 'http';
import { getBlinkAuth, refreshBlinkAuth, setBlinkAuth, hasBlinkAuth } from './blink-auth';

function buildHeaders(mode: 'bearer' | 'token-auth', token: string, accountId: string): Record<string, string> {
  const headers: Record<string, string> = {
    'account-id': accountId,
    'Accept': 'image/jpeg,image/*;q=0.9,*/*;q=0.8',
    'User-Agent': 'Blink/10.2.0 (iPhone; iOS 16.6)',
  };

  if (mode === 'bearer') {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Some endpoints expect TOKEN-AUTH, others token-auth — set both to be safe
    headers['token-auth'] = token;
    headers['TOKEN-AUTH'] = token;
  }

  return headers;
}

interface FetchResult {
  ok: true;
  dataUrl: string;
}

interface FetchError {
  ok: false;
  status: number;
  body: string;
}

async function fetchOnce(url: string, mode: 'bearer' | 'token-auth'): Promise<FetchResult | FetchError> {
  const { token, accountId } = getBlinkAuth();
  const headers = buildHeaders(mode, token, accountId);
  
  console.log(`📹 Fetching image with ${mode} mode: ${url}`);
  console.log(`📹 Headers: account-id=${accountId}, token=***${token.slice(-4)}`);
  
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: isHttps ? 443 : 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers,
    };

    const req = httpModule.request(options, (res) => {
      console.log(`📹 Response status: ${res.statusCode}`);
      console.log(`📹 Response headers:`, res.headers);
      
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const textMaybe = buffer.toString('utf-8');
        
        // Check if response looks like JSON error
        const looksJson = textMaybe.startsWith('{') && textMaybe.includes('"message"');
        
        if (res.statusCode === 200 && !looksJson) {
          // Success - return image as data URL
          const base64 = buffer.toString('base64');
          const mime = res.headers['content-type'] || 'image/jpeg';
          const dataUrl = `data:${mime};base64,${base64}`;
          console.log(`📹 Image fetched successfully, size: ${buffer.length} bytes`);
          resolve({ ok: true, dataUrl });
        } else {
          // Error - return status and body
          console.log(`📹 Fetch failed: status=${res.statusCode}, body=${textMaybe.slice(0, 200)}`);
          resolve({
            ok: false,
            status: res.statusCode || 0,
            body: textMaybe.slice(0, 500) // Limit body size for logging
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('📹 HTTP error:', error);
      resolve({
        ok: false,
        status: 0,
        body: error.message
      });
    });

    req.end();
  });
}

function isUnauthorized(status: number, body: string): boolean {
  return (
    status === 401 ||
    status === 403 ||
    body.includes('"code":101') ||
    /Unauthorized/i.test(body)
  );
}

export function registerBlinkImageFetcher() {
  ipcMain.handle('fetch-blink-image', async (_evt, { url }: { url: string }) => {
    console.log(`📹 fetch-blink-image handler called: ${url}`);
    
    if (!hasBlinkAuth()) {
      throw new Error('Blink authentication not initialized');
    }
    
    let { headerMode } = getBlinkAuth();

    // 1) Try with current mode
    let result = await fetchOnce(url, headerMode);
    if (result.ok) {
      return result.dataUrl;
    }

    // Treat as error object going forward
    let err = result as FetchError;

    // Check if unauthorized
    if (isUnauthorized(err.status, err.body)) {
      console.log('📹 Unauthorized response, trying header mode swap...');

      // 2) Try swapping header mode (bearer <-> token-auth)
      headerMode = headerMode === 'bearer' ? 'token-auth' : 'bearer';
      const current = getBlinkAuth();
      setBlinkAuth({ ...current, headerMode });

      result = await fetchOnce(url, headerMode);
      if (result.ok) {
        return result.dataUrl;
      }
      err = result as FetchError;

      // 3) Refresh token and retry once
      console.log('📹 Still unauthorized, attempting token refresh...');
      try {
        const fresh = await refreshBlinkAuth();
        setBlinkAuth(fresh);

        result = await fetchOnce(url, fresh.headerMode);
        if (result.ok) {
          return result.dataUrl;
        }
        err = result as FetchError;
      } catch (refreshError) {
        console.error('📹 Token refresh failed:', refreshError);
      }
    }

    // Fallthrough: bubble up useful, redacted info
    const status = err.status;
    const body = err.body.slice(0, 200); // Redact/limit
    throw new Error(`Blink media fetch failed (status=${status}). Body: ${body}`);
  });

  console.log('📹 Blink image fetcher registered');
}

