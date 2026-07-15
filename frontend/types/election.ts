export interface ElectionStats {
  totalVoters: number;
  votesIn: number;
  participationRate: number;
}

export interface Election {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'RESULTS_PUBLISHED';
  stats: ElectionStats;
}

export interface Candidate {
  id: number;
  election_id: number;
  order_number: number;
  name: string;
  current_role: string;
  tagline: string;
  vision: string;
  mission: string;
  experience: string;
  photo_url: string;
}

export interface VoteReceipt {
  verificationCode: string;
  votedAt: string;
  status: string;
  candidateName?: string;
  candidateOrder?: number;
}
