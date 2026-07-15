export interface User {
  id: string;
  nim: string;
  name: string;
  role: 'ADMIN' | 'VOTER';
  hasVoted: boolean;
  votedAt?: string;
  hasPublicKey: boolean;
}

export interface ElectionStats {
  totalVoters: number;
  votesIn: number;
  participationRate: number;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'RESULTS_PUBLISHED';
  stats?: ElectionStats;
}

export interface Candidate {
  id: string;
  election_id: string;
  order_number: number;
  name: string;
  current_role: string;
  tagline: string;
  vision: string;
  mission: string;
  experience: string;
  photo_url: string | null;
  created_at: string;
}

export interface VoteReceipt {
  verificationCode: string;
  votedAt: string;
  status: string;
}

export interface AdminStats {
  totalVoters: number;
  totalCandidates: number;
  votesIn: number;
  participationRate: number;
  electionStatus: string;
}

export interface ParticipationTimeline {
  hour: string;
  count: number;
}

export interface CandidateResult {
  id: string;
  name: string;
  orderNumber: number;
  photoUrl: string | null;
  voteCount: number;
  percentage: number;
}

export interface ElectionResults {
  election: {
    title: string;
    totalVoters: number;
    votesIn: number;
    participationRate: number;
  };
  candidates: CandidateResult[];
  winner: CandidateResult | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
