import { NextRequest, NextResponse } from 'next/server';
import {
  BUNNY_STREAM_BASE_URL,
  getBunnyHeaders,
  getBunnyStreamConfig,
  BunnyStreamConfig,
} from '@/lib/bunnyStream';

// Helper to extract credentials from query/header/body or server env
function extractConfig(req: NextRequest, body?: any): BunnyStreamConfig {
  const headerKey = req.headers.get('x-bunny-api-key') || req.headers.get('accesskey');
  const headerLib = req.headers.get('x-bunny-library-id');
  const headerCdn = req.headers.get('x-bunny-cdn-hostname');

  const url = new URL(req.url);
  const queryKey = url.searchParams.get('apiKey');
  const queryLib = url.searchParams.get('libraryId');
  const queryCdn = url.searchParams.get('cdnHostname');

  const bodyKey = body?.apiKey;
  const bodyLib = body?.libraryId;
  const bodyCdn = body?.cdnHostname;

  return getBunnyStreamConfig({
    apiKey: headerKey || queryKey || bodyKey,
    libraryId: headerLib || queryLib || bodyLib,
    cdnHostname: headerCdn || queryCdn || bodyCdn,
  });
}

/**
 * GET Handler:
 * - action=list: list videos
 * - action=get: get single video details
 * - action=collections: list collections
 * - action=test: verify API key and library connection
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'list';
  const cfg = extractConfig(req);

  if (!cfg.apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing Bunny Stream API Key (AccessKey). Please configure BUNNY_STREAM_API_KEY.',
        configured: false,
      },
      { status: 400 }
    );
  }

  try {
    // 1. Test Connection
    if (action === 'test') {
      const testRes = await fetch(
        `${BUNNY_STREAM_BASE_URL}/library/${cfg.libraryId}/videos?page=1&itemsPerPage=1`,
        {
          method: 'GET',
          headers: getBunnyHeaders(cfg.apiKey),
        }
      );

      if (!testRes.ok) {
        const errText = await testRes.text();
        return NextResponse.json(
          {
            success: false,
            error: `Bunny Stream returned ${testRes.status}: ${errText}`,
            status: testRes.status,
          },
          { status: testRes.status }
        );
      }

      const data = await testRes.json();
      return NextResponse.json({
        success: true,
        message: 'Connected to Bunny Stream successfully!',
        libraryId: cfg.libraryId,
        cdnHostname: cfg.cdnHostname,
        totalVideosInLibrary: data.totalItems ?? 0,
      });
    }

    // 2. Get Single Video
    if (action === 'get') {
      const videoId = url.searchParams.get('videoId');
      if (!videoId) {
        return NextResponse.json({ error: 'videoId parameter is required' }, { status: 400 });
      }

      const res = await fetch(`${BUNNY_STREAM_BASE_URL}/library/${cfg.libraryId}/videos/${videoId}`, {
        method: 'GET',
        headers: getBunnyHeaders(cfg.apiKey),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: errText }, { status: res.status });
      }

      const video = await res.json();
      return NextResponse.json({ success: true, video });
    }

    // 3. List Collections
    if (action === 'collections') {
      const res = await fetch(`${BUNNY_STREAM_BASE_URL}/library/${cfg.libraryId}/collections`, {
        method: 'GET',
        headers: getBunnyHeaders(cfg.apiKey),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: errText }, { status: res.status });
      }

      const collections = await res.json();
      return NextResponse.json({ success: true, collections });
    }

    // 4. Default: List Videos
    const page = url.searchParams.get('page') || '1';
    const itemsPerPage = url.searchParams.get('itemsPerPage') || '50';
    const search = url.searchParams.get('search') || '';
    const collection = url.searchParams.get('collection') || '';

    const queryParams = new URLSearchParams({
      page,
      itemsPerPage,
      orderBy: 'date',
    });
    if (search) queryParams.set('search', search);
    if (collection) queryParams.set('collection', collection);

    const res = await fetch(
      `${BUNNY_STREAM_BASE_URL}/library/${cfg.libraryId}/videos?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getBunnyHeaders(cfg.apiKey),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      libraryId: cfg.libraryId,
      cdnHostname: cfg.cdnHostname,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST Handler:
 * - action=create: Create video slot on Bunny Stream
 * - action=fetch: Ingest video from external URL
 * - action=collection: Create collection
 * - action=delete: Delete video
 */
export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = body.action || 'create';
  const cfg = extractConfig(req, body);

  if (!cfg.apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing Bunny Stream API Key (AccessKey). Please provide or configure it.',
      },
      { status: 400 }
    );
  }

  try {
    // 1. Create Video Record
    if (action === 'create') {
      const title = body.title || `MSI Live Lecture - ${new Date().toLocaleDateString('en-IN')}`;
      const collectionId = body.collectionId;
      const thumbnailTime = body.thumbnailTime || 0;

      const res = await fetch(`${BUNNY_STREAM_BASE_URL}/library/${cfg.libraryId}/videos`, {
        method: 'POST',
        headers: getBunnyHeaders(cfg.apiKey),
        body: JSON.stringify({
          title,
          collectionId: collectionId || undefined,
          thumbnailTime,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ success: false, error: errText }, { status: res.status });
      }

      const video = await res.json();
      return NextResponse.json({
        success: true,
        message: 'Video created successfully on Bunny Stream',
        video,
        embedUrl: `https://player.mediadelivery.net/embed/${cfg.libraryId}/${video.guid}`,
        hlsUrl: `https://${cfg.cdnHostname}/${video.guid}/playlist.m3u8`,
        mp4Url: `https://${cfg.cdnHostname}/${video.guid}/play_720p.mp4`,
        thumbnailUrl: `https://${cfg.cdnHostname}/${video.guid}/thumbnail.jpg`,
      });
    }

    // 2. Fetch from External URL (Asynchronous Ingestion)
    if (action === 'fetch') {
      const url = body.url;
      const title = body.title || 'Imported Video';
      const collectionId = body.collectionId;

      if (!url) {
        return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
      }

      const res = await fetch(`${BUNNY_STREAM_BASE_URL}/library/${cfg.libraryId}/videos/fetch`, {
        method: 'POST',
        headers: getBunnyHeaders(cfg.apiKey),
        body: JSON.stringify({
          url,
          title,
          collectionId: collectionId || undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ success: false, error: errText }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({
        success: true,
        message: 'Video ingestion started on Bunny Stream',
        data,
      });
    }

    // 3. Create Collection
    if (action === 'collection') {
      const name = body.name;
      if (!name) {
        return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
      }

      const res = await fetch(`${BUNNY_STREAM_BASE_URL}/library/${cfg.libraryId}/collections`, {
        method: 'POST',
        headers: getBunnyHeaders(cfg.apiKey),
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ success: false, error: errText }, { status: res.status });
      }

      const collection = await res.json();
      return NextResponse.json({ success: true, collection });
    }

    // 4. Delete Video
    if (action === 'delete') {
      const videoId = body.videoId;
      if (!videoId) {
        return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
      }

      const res = await fetch(`${BUNNY_STREAM_BASE_URL}/library/${cfg.libraryId}/videos/${videoId}`, {
        method: 'DELETE',
        headers: getBunnyHeaders(cfg.apiKey),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ success: false, error: errText }, { status: res.status });
      }

      return NextResponse.json({ success: true, message: 'Video deleted from Bunny Stream' });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
