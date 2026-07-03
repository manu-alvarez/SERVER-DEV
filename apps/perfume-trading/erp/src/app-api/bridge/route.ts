import { NextResponse } from 'next/server';

/**
 * GET /api/bridge?url=<encoded-url>
 *
 * Bridge API para integración de fuentes externas.
 * Actúa como proxy para evitar CORS y centralizar el fetching.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing ?url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Teringo-Bridge/1.0',
        Accept: 'application/json, text/html',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `External server returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const text = await response.text();
    return NextResponse.json({
      fetched: true,
      size: text.length,
      snippet: text.substring(0, 1000),
      note: 'Response was not JSON. Showing text snippet.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bridge fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
