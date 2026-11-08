import { NextRequest, NextResponse } from 'next/server';

export interface ServerLiveViewer {
  id: string;
  name: string;
  batch: string;
  joinedAt: number;
  lastSeen: number;
}

export interface ServerChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isTeacher: boolean;
  timestamp: number;
  studentId?: string;
}

export interface ServerLiveState {
  isLive: boolean;
  streamTitle: string;
  teacherName: string;
  courseId: string;
  targetBatch: string;
  startedAt: number;
  activeViewers: ServerLiveViewer[];
  chatMessages: ServerChatMessage[];
  latestFrame: string | null;
  webrtcOffer: any | null;
  webrtcCandidates: any[];
  webrtcAnswers: Record<string, { answer: any; candidates: any[] }>;
  savedLectures: any[];
}

// Global in-memory storage that survives hot reloads in Node runtime
const globalStore = globalThis as unknown as {
  __MSI_SERVER_LIVE_STATE__?: ServerLiveState;
};

if (!globalStore.__MSI_SERVER_LIVE_STATE__) {
  globalStore.__MSI_SERVER_LIVE_STATE__ = {
    isLive: false,
    streamTitle: 'Constitutional Law & Legal Reasoning Masterclass',
    teacherName: 'Dr. Ekta Gahlawat',
    courseId: 'MSI/LEGSTUDIES-/01',
    targetBatch: 'Semester V (CLAT UG)',
    startedAt: 0,
    activeViewers: [],
    chatMessages: [],
    latestFrame: null,
    webrtcOffer: null,
    webrtcCandidates: [],
    webrtcAnswers: {},
    savedLectures: [],
  };
}

function getState(): ServerLiveState {
  const state = globalStore.__MSI_SERVER_LIVE_STATE__!;
  // Prune viewers not seen in the last 20 seconds
  const now = Date.now();
  state.activeViewers = state.activeViewers.filter((v) => now - v.lastSeen < 20000);
  return state;
}

// GET: Fetch current live status, chat, viewers, and latest frame
export async function GET(req: NextRequest) {
  const state = getState();
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'status';

  if (action === 'vods') {
    return NextResponse.json({
      success: true,
      vods: state.savedLectures,
    });
  }

  return NextResponse.json({
    success: true,
    isLive: state.isLive,
    streamTitle: state.streamTitle,
    teacherName: state.teacherName,
    courseId: state.courseId,
    targetBatch: state.targetBatch,
    startedAt: state.startedAt,
    viewerCount: state.activeViewers.length,
    activeViewers: state.activeViewers,
    chatMessages: state.chatMessages,
    hasFrame: !!state.latestFrame,
    latestFrame: state.latestFrame,
    webrtcOffer: state.webrtcOffer,
    webrtcCandidates: state.webrtcCandidates,
  });
}

// POST: Actions for stream management, chat, heartbeat, and WebRTC
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;
    const state = getState();
    const now = Date.now();

    // 1. Start Stream
    if (action === 'start') {
      state.isLive = true;
      state.streamTitle = body.streamTitle || 'Live Moot & Masterclass: Law Cohort 2026';
      state.teacherName = body.teacherName || 'Dr. Ekta Gahlawat';
      state.courseId = body.courseId || 'MSI/LEGSTUDIES-/01';
      state.targetBatch = body.targetBatch || 'Semester V (CLAT UG)';
      state.startedAt = now;
      state.webrtcOffer = body.webrtcOffer || null;
      state.webrtcCandidates = [];
      state.webrtcAnswers = {};
      state.latestFrame = null;
      // Keep real chat or start empty (NO DUMMY MESSAGES)
      if (body.resetChat) {
        state.chatMessages = [];
      }
      return NextResponse.json({ success: true, message: 'Stream started', state });
    }

    // 2. End Stream
    if (action === 'end') {
      state.isLive = false;
      const durationSec = state.startedAt > 0 ? Math.floor((now - state.startedAt) / 1000) : 0;
      const min = Math.floor(durationSec / 60);
      const sec = durationSec % 60;
      const durationStr = `${min}m ${sec}s`;

      const recordedItem = {
        id: 'rec-' + now,
        title: state.streamTitle,
        faculty: state.teacherName,
        duration: durationStr,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        videoUrl: body.videoUrl || '',
        thumbnail: body.thumbnail || '',
        courseCode: state.courseId,
        subject: state.targetBatch,
        topics: ['Ratio Decidendi', 'Obiter Dicta', 'Constitution Bench Rulings'],
      };

      state.savedLectures = [recordedItem, ...state.savedLectures];
      state.webrtcOffer = null;
      state.webrtcCandidates = [];
      state.webrtcAnswers = {};
      state.latestFrame = null;

      return NextResponse.json({ success: true, message: 'Stream ended', recordedItem });
    }

    // 3. Push Live Video Frame (from Teacher's Camera / Screen for ultra-low latency mobile sync)
    if (action === 'push-frame') {
      if (body.frame) {
        state.latestFrame = body.frame;
      }
      return NextResponse.json({ success: true });
    }

    // 4. Viewer Heartbeat / Register
    if (action === 'heartbeat') {
      const viewer: ServerLiveViewer = {
        id: body.id || 'MSI-2025-LAW-042',
        name: body.name || 'Aarav Sharma',
        batch: body.batch || 'Semester V (CLAT UG)',
        joinedAt: body.joinedAt || now,
        lastSeen: now,
      };

      const existingIndex = state.activeViewers.findIndex((v) => v.id === viewer.id);
      if (existingIndex >= 0) {
        state.activeViewers[existingIndex].lastSeen = now;
      } else {
        state.activeViewers.push(viewer);
      }

      return NextResponse.json({
        success: true,
        viewerCount: state.activeViewers.length,
        activeViewers: state.activeViewers,
      });
    }

    // 5. Viewer Leave
    if (action === 'leave') {
      const viewerId = body.id || 'MSI-2025-LAW-042';
      state.activeViewers = state.activeViewers.filter((v) => v.id !== viewerId);
      return NextResponse.json({ success: true, viewerCount: state.activeViewers.length });
    }

    // 6. Send Chat Message (Real time, no dummy data)
    if (action === 'send-chat') {
      const newMsg: ServerChatMessage = {
        id: 'msg-' + now + '-' + Math.random().toString(36).substring(2, 6),
        sender: body.sender || 'Aarav Sharma',
        text: body.text || '',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isTeacher: !!body.isTeacher,
        timestamp: now,
        studentId: body.studentId,
      };

      state.chatMessages.push(newMsg);
      // Keep last 100 messages
      if (state.chatMessages.length > 100) {
        state.chatMessages = state.chatMessages.slice(-100);
      }

      return NextResponse.json({ success: true, message: newMsg, chatMessages: state.chatMessages });
    }

    // 7. Delete Chat Message (Requested by user)
    if (action === 'delete-chat') {
      const msgId = body.id;
      if (msgId) {
        state.chatMessages = state.chatMessages.filter((m) => m.id !== msgId);
      }
      return NextResponse.json({ success: true, chatMessages: state.chatMessages });
    }

    // 8. WebRTC Signaling: Offer from Teacher
    if (action === 'signal-offer') {
      state.webrtcOffer = body.offer;
      state.webrtcCandidates = body.candidates || [];
      return NextResponse.json({ success: true });
    }

    // 9. WebRTC Signaling: Answer from Student
    if (action === 'signal-answer') {
      const viewerId = body.viewerId || 'default';
      state.webrtcAnswers[viewerId] = {
        answer: body.answer,
        candidates: body.candidates || [],
      };
      return NextResponse.json({ success: true });
    }

    // 10. WebRTC Signaling: Teacher poll for student answers
    if (action === 'get-answers') {
      const answers = { ...state.webrtcAnswers };
      state.webrtcAnswers = {}; // consume
      return NextResponse.json({ success: true, answers });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
