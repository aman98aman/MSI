export type EventType =
  | 'online_cbt'
  | 'offline_mock'
  | 'hybrid'
  | 'debate_competition';

export type ParticipationMode = 'online' | 'offline' | 'both';

export type ExamLifecycleStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'upcoming'
  | 'live'
  | 'ended'
  | 'results_processing'
  | 'results_published'
  | 'cancelled'
  | 'archived';

export interface RegistrationFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface OfflineVenueConfig {
  venueName: string;
  fullAddress: string;
  reportingTime: string;
  checkInInstructions: string;
  capacity?: number;
}

export interface DebateConfig {
  theme: string;
  participationFormat: 'individual' | 'team' | 'both';
  maxTeamSize?: number;
  onlineMethod?: string;
  rounds?: string[];
  prizes?: string;
  judgingCriteria?: string;
}

export interface CbtRulesConfig {
  totalQuestions: number;
  marksPerQuestion: number;
  negativeMarking: number;
  unansweredPolicy: 'zero' | 'negative';
  passingMarks?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  disablePreviousNav: boolean;
  requireFullscreen: boolean;
  tabSwitchThreshold: number;
  fullscreenExitThreshold: number;
  autoSubmitOnViolation: boolean;
  webcamRequired: boolean;
}

export interface ExamScheduleConfig {
  examDate: string; // YYYY-MM-DD
  loginOpenAt: string; // ISO string
  startAt: string; // ISO string
  endAt: string; // ISO string
  durationMinutes: number;
  timezone: 'Asia/Kolkata';
  lateEntryGraceMinutes: number;
  autoSubmitAtExpiry: boolean;
  reconnectPolicy: 'allow_resume' | 'single_session_lock';
}

export interface ExamRegistrationConfig {
  isFree: boolean;
  feeAmount: number;
  currency: 'INR';
  registrationOpenAt: string; // ISO string
  registrationCloseAt: string; // ISO string
  maxRegistrations?: number;
  registrationPaused?: boolean;
  allowWebsiteRegistration: boolean;
  allowOfflineRegistration: boolean;
  eligibilityText: string;
  customFields: RegistrationFieldConfig[];
  consentNotice: string;
}

export interface ExamEvent {
  id: string;
  code: string; // unique e.g. CLAT-2026-01
  publicSlug: string; // unique URL slug e.g. clat-scholarship-2026
  title: string;
  description: string;
  eventType: EventType;
  participationMode: ParticipationMode;
  category: string; // CLAT, Judiciary, UGC NET Law, UCC Debate, Scholarship, etc.
  targetAudience: string;
  instructions: string;
  bannerUrl?: string;
  contactPhones?: string;
  contactEmail?: string;
  status: ExamLifecycleStatus;
  registrationConfig: ExamRegistrationConfig;
  scheduleConfig: ExamScheduleConfig;
  cbtRules?: CbtRulesConfig;
  offlineVenue?: OfflineVenueConfig;
  debateConfig?: DebateConfig;
  activePaperVersion: number;
  paperVerified: boolean;
  hasStartedAttempts: boolean;
  qrVersion: number;
  qrRevoked?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  archivedAt?: string;
}

export interface ExamBatch {
  id: string;
  examId: string;
  batchCode: string;
  batchName: string;
  hasSubPapers?: boolean;
  scheduleOverride?: Partial<ExamScheduleConfig>;
  venueOverride?: Partial<OfflineVenueConfig>;
  capacity?: number;
  status: 'active' | 'full' | 'closed';
  createdAt: string;
}

export interface ExamCandidate {
  id: string;
  uid: string; // globally unique e.g. MSI-CLAT26-26-0001
  fullName: string;
  mobile: string; // sanitized 10-digit
  email: string;
  institution?: string;
  classOrCourse?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamRegistration {
  id: string;
  examId: string;
  batchId?: string;
  candidateId: string;
  uid: string;
  fullName: string;
  mobile: string;
  email: string;
  participationMode: 'online' | 'offline';
  source: 'website' | 'offline_admin';
  registrationStatus: 'pending_payment' | 'confirmed' | 'cancelled';
  paymentStatus: 'free' | 'pending' | 'verified' | 'failed' | 'refunded';
  feeAmount: number;
  customFieldValues?: Record<string, string>;
  teamName?: string;
  teamMembers?: string[];
  operatorId?: string;
  registeredAt: string;
  confirmedAt?: string;
}

export interface ExamPayment {
  id: string;
  examId: string;
  registrationId: string;
  candidateId?: string;
  uid?: string;
  amount: number;
  currency: 'INR';
  method: 'razorpay' | 'offline_cash' | 'offline_upi' | 'offline_bank' | 'free';
  status: 'created' | 'verified' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  offlineReceiptRef?: string;
  operatorId?: string;
  webhookProcessed?: boolean;
  createdAt: string;
  verifiedAt?: string;
}

export interface ExamQuestionOption {
  id: string; // canonical option id: 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  batchId?: string;
  subPaper?: string; // e.g. 'PAPER_1' | 'PAPER_2'
  paperVersion: number;
  orderIndex: number;
  section: string;
  text: string;
  imageUrl?: string;
  options: ExamQuestionOption[];
  correctOptionId: string; // SERVER-ONLY, never sent to candidate before result publication
  marks: number;
  negativeMarks: number;
  explanation?: string;
  status: 'active' | 'draft' | 'disabled';
  createdAt: string;
}

export interface ExamPaperVersion {
  id: string;
  examId: string;
  batchId?: string;
  subPaper?: string;
  version: number;
  questionIds: string[];
  totalQuestions: number;
  totalMarks: number;
  verifiedBy: string;
  verifiedAt: string;
  locked: boolean;
}

export interface AttemptQuestionSnapshot {
  questionId: string;
  displayOrder: number;
  optionOrder: string[]; // canonical option IDs in shuffled order e.g. ['C', 'A', 'D', 'B']
}

export interface ExamAttempt {
  id: string;
  examId: string;
  batchId?: string;
  subPaper?: string; // e.g. 'PAPER_1' | 'PAPER_2'
  subPaperLabel?: string; // e.g. 'Paper 1' | 'Paper 2'
  registrationId: string;
  candidateId: string;
  uid: string;
  paperVersion: number;
  questionSequence: AttemptQuestionSnapshot[];
  currentIndex: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'auto_submitted';
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  sessionTokenId: string;
  violationCount: number;
  fullscreenExitCount: number;
  tabSwitchCount: number;
  windowBlurCount: number;
  rawScore?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  evaluatedAt?: string;
}

export interface CandidateAnswer {
  id: string;
  attemptId: string;
  examId: string;
  questionId: string;
  selectedOptionId: string | null;
  locked: boolean;
  savedAt: string;
}

export interface ExamProctorEvent {
  id: string;
  attemptId: string;
  examId: string;
  candidateId: string;
  uid: string;
  eventType:
    | 'attempt_started'
    | 'answer_saved'
    | 'question_advanced'
    | 'fullscreen_entered'
    | 'fullscreen_exited'
    | 'tab_hidden'
    | 'window_blurred'
    | 'connection_lost'
    | 'connection_reconnected'
    | 'submit_clicked'
    | 'auto_submitted';
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ExamAttendance {
  id: string;
  examId: string;
  batchId?: string;
  registrationId: string;
  candidateId: string;
  uid: string;
  status: 'present' | 'absent';
  checkedInAt?: string;
  operatorId: string;
  notes?: string;
}

export interface ExamAuditLog {
  id: string;
  entityType: 'exam' | 'batch' | 'paper' | 'registration' | 'payment' | 'result' | 'attendance';
  entityId: string;
  examId?: string;
  actorId: string;
  actorName: string;
  action: string;
  summary: string;
  before?: any;
  after?: any;
  createdAt: string;
}
