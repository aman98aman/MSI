import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE_NAME = 'msi_exam_admin_session';
export const CANDIDATE_COOKIE_NAME = 'msi_exam_candidate_session';

function getSessionSecret(): string {
  const envSecret =
    process.env.EXAM_SESSION_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    'msi_exam_session_fallback_key_2026_v1';
  return crypto.createHash('sha256').update(envSecret).digest('hex');
}

export interface AdminSessionPayload {
  role: 'super-admin';
  actorId: string;
  actorName: string;
  exp: number;
}

export interface CandidateSessionPayload {
  role: 'candidate';
  candidateId: string;
  registrationId: string;
  examId: string;
  uid: string;
  sessionTokenId: string;
  exp: number;
}

function signPayload(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as T;
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createAdminSessionToken(actorId: string, actorName: string): string {
  const payload: AdminSessionPayload = {
    role: 'super-admin',
    actorId,
    actorName,
    exp: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
  };
  return signPayload(payload);
}

export function createCandidateSessionToken(
  params: Omit<CandidateSessionPayload, 'role' | 'exp'>
): string {
  const payload: CandidateSessionPayload = {
    role: 'candidate',
    ...params,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  };
  return signPayload(payload);
}

export function getAdminSession(req: NextRequest): AdminSessionPayload | null {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const parsed = verifyToken<AdminSessionPayload>(cookie);
  if (!parsed || parsed.role !== 'super-admin') return null;
  return parsed;
}

export function getCandidateSession(req: NextRequest): CandidateSessionPayload | null {
  const cookie = req.cookies.get(CANDIDATE_COOKIE_NAME)?.value;
  const parsed = verifyToken<CandidateSessionPayload>(cookie);
  if (!parsed || parsed.role !== 'candidate') return null;
  return parsed;
}

export function unauthorizedAdminResponse() {
  return NextResponse.json(
    { success: false, message: 'Unauthorized: Super Admin session required.' },
    { status: 401 }
  );
}

export function unauthorizedCandidateResponse(message = 'Unauthorized: Candidate session required.') {
  return NextResponse.json(
    { success: false, message },
    { status: 401 }
  );
}

// In-memory sliding-window rate limiter per serverless instance
declare global {
  // eslint-disable-next-line no-var
  var _msiExamRateLimitMap: Map<string, { count: number; resetAt: number }> | undefined;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  if (!global._msiExamRateLimitMap) {
    global._msiExamRateLimitMap = new Map();
  }
  const now = Date.now();
  const entry = global._msiExamRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    global._msiExamRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
