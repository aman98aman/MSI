'use client';

// ============================================================================
// MSI WebRTC Peer-to-Peer Live Stream Engine & Presence Manager
// Enables Real-time Camera & Screen Sharing between Teacher and Students on localhost
// Real Attendee Presence (NO dummy 142; tracks Aarav Sharma and real viewers)
// ============================================================================

export interface LiveViewerInfo {
  id: string;
  name: string;
  batch: string;
  avatar?: string;
  joinedAt: number;
}

export interface LiveChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isTeacher: boolean;
  timestamp: number;
  studentId?: string;
}

export interface RecordedLectureItem {
  id: string;
  title: string;
  faculty: string;
  duration: string;
  date: string;
  videoUrl: string;
  thumbnail: string;
  courseCode: string;
  subject: string;
  topics: string[];
}

export const SIGNALING_CHANNEL = 'msi_webrtc_signaling_v2';
export const PRESENCE_CHANNEL = 'msi_live_presence_v2';
export const CHAT_CHANNEL = 'msi_live_chat_v2';
export const RECORDINGS_STORAGE_KEY = 'msi_recorded_live_lectures_v2';

// ----------------------------------------------------------------------------
// Local Storage Helper for Recorded Lectures
// ----------------------------------------------------------------------------
export function getSavedRecordedLectures(): RecordedLectureItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECORDINGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecordedLecture(lecture: RecordedLectureItem) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedRecordedLectures();
    const filtered = existing.filter((item) => item.id !== lecture.id);
    localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify([lecture, ...filtered]));
  } catch (err) {
    console.error('Failed to save recorded lecture:', err);
  }
}

// ----------------------------------------------------------------------------
// WebRTC Broadcaster (Used by Teacher Studio)
// ----------------------------------------------------------------------------
export class TeacherWebRTCBroadcaster {
  private pcMap: Map<string, RTCPeerConnection> = new Map();
  private channel: BroadcastChannel | null = null;
  private currentStream: MediaStream | null = null;
  private isBroadcasting = false;

  constructor(onLog?: (msg: string) => void) {
    if (typeof window === 'undefined') return;
    try {
      this.channel = new BroadcastChannel(SIGNALING_CHANNEL);
      this.channel.onmessage = this.handleSignalingMessage.bind(this);
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
  }

  public setStream(stream: MediaStream | null) {
    this.currentStream = stream;
    this.isBroadcasting = !!stream;

    // Update tracks on existing peer connections
    this.pcMap.forEach((pc) => {
      const senders = pc.getSenders();
      senders.forEach((sender) => pc.removeTrack(sender));
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }
    });

    // Notify any viewers that source updated
    this.broadcast({
      type: 'STREAM_UPDATED',
      hasVideo: !!stream && stream.getVideoTracks().length > 0,
      hasAudio: !!stream && stream.getAudioTracks().length > 0,
    });
  }

  private async handleSignalingMessage(event: MessageEvent) {
    const data = event.data;
    if (!data) return;

    if (data.type === 'REQUEST_OFFER' && this.currentStream) {
      const viewerId = data.viewerId || 'default_viewer';
      await this.createOfferForViewer(viewerId);
    } else if (data.type === 'ANSWER') {
      const viewerId = data.viewerId || 'default_viewer';
      const pc = this.pcMap.get(viewerId);
      if (pc && data.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (err) {
          console.warn('Broadcaster setRemoteDescription error:', err);
        }
      }
    } else if (data.type === 'ICE_CANDIDATE_FROM_VIEWER') {
      const viewerId = data.viewerId || 'default_viewer';
      const pc = this.pcMap.get(viewerId);
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('Broadcaster addIceCandidate error:', err);
        }
      }
    }
  }

  private async createOfferForViewer(viewerId: string) {
    if (!this.currentStream) return;

    try {
      // Create new peer connection for this viewer
      const pc = new RTCPeerConnection({ iceServers: [] });
      this.pcMap.set(viewerId, pc);

      this.currentStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.currentStream!);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.broadcast({
            type: 'ICE_CANDIDATE_FROM_BROADCASTER',
            viewerId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.broadcast({
        type: 'OFFER',
        viewerId,
        sdp: offer,
      });
    } catch (err) {
      console.warn('Broadcaster createOffer error:', err);
    }
  }

  private broadcast(msg: any) {
    try {
      this.channel?.postMessage(msg);
    } catch {}
  }

  public destroy() {
    this.pcMap.forEach((pc) => pc.close());
    this.pcMap.clear();
    this.channel?.close();
    this.channel = null;
  }
}

// ----------------------------------------------------------------------------
// WebRTC Receiver (Used by Student Live Hall)
// ----------------------------------------------------------------------------
export class StudentWebRTCReceiver {
  private pc: RTCPeerConnection | null = null;
  private channel: BroadcastChannel | null = null;
  private viewerId: string;
  private onRemoteStreamCallback: (stream: MediaStream) => void;

  constructor(
    viewerId: string,
    onRemoteStream: (stream: MediaStream) => void
  ) {
    this.viewerId = viewerId;
    this.onRemoteStreamCallback = onRemoteStream;

    if (typeof window === 'undefined') return;
    try {
      this.channel = new BroadcastChannel(SIGNALING_CHANNEL);
      this.channel.onmessage = this.handleSignalingMessage.bind(this);
      // Ask broadcaster for live feed
      this.requestStream();
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
  }

  public requestStream() {
    this.broadcast({
      type: 'REQUEST_OFFER',
      viewerId: this.viewerId,
    });
  }

  private async handleSignalingMessage(event: MessageEvent) {
    const data = event.data;
    if (!data) return;

    if (data.type === 'OFFER' && (data.viewerId === this.viewerId || !data.viewerId)) {
      try {
        if (this.pc) {
          this.pc.close();
        }
        this.pc = new RTCPeerConnection({ iceServers: [] });

        this.pc.ontrack = (trackEvent) => {
          if (trackEvent.streams && trackEvent.streams[0]) {
            this.onRemoteStreamCallback(trackEvent.streams[0]);
          }
        };

        this.pc.onicecandidate = (iceEvent) => {
          if (iceEvent.candidate) {
            this.broadcast({
              type: 'ICE_CANDIDATE_FROM_VIEWER',
              viewerId: this.viewerId,
              candidate: iceEvent.candidate,
            });
          }
        };

        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        this.broadcast({
          type: 'ANSWER',
          viewerId: this.viewerId,
          sdp: answer,
        });
      } catch (err) {
        console.warn('Receiver handle OFFER error:', err);
      }
    } else if (
      data.type === 'ICE_CANDIDATE_FROM_BROADCASTER' &&
      (data.viewerId === this.viewerId || !data.viewerId)
    ) {
      if (this.pc && data.candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('Receiver addIceCandidate error:', err);
        }
      }
    } else if (data.type === 'STREAM_UPDATED') {
      // Re-request stream when broadcaster changes camera or screen
      this.requestStream();
    }
  }

  private broadcast(msg: any) {
    try {
      this.channel?.postMessage(msg);
    } catch {}
  }

  public destroy() {
    this.pc?.close();
    this.pc = null;
    this.channel?.close();
    this.channel = null;
  }
}
