export type ClubRole = 'owner' | 'admin' | 'coach' | 'player' | 'parent' | 'volunteer';
export interface Club {
    id: string;
    name: string;
    crestUri?: string;
    location?: string;
    ageCategory?: string;
    createdAt: number;
}
export interface Member {
    id: string;
    did: string;
    role: ClubRole;
    joinedAt: number;
    invitedBy?: string;
}
export interface PlayerStats {
    height?: number;
    weight?: number;
    preferredFoot?: 'left' | 'right' | 'both';
}
export interface RosterEntry {
    id: string;
    playerId: string;
    name: string;
    position: string;
    jerseyNumber?: number;
    guardianDid?: string;
    consentFlags: {
        photoConsent: boolean;
        dataShareConsent: boolean;
        minorSafetyConsent: boolean;
    };
    stats?: PlayerStats;
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    };
}
export type MatchEventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'possession' | 'period_start' | 'period_end';
export interface MatchEvent {
    id: string;
    type: MatchEventType;
    minute: number;
    playerId?: string;
    playerOutId?: string;
    details?: string;
    timestamp: number;
    causalClock: number;
    loggedByDid: string;
}
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export interface Match {
    id: string;
    clubId: string;
    tournamentId?: string;
    homeTeam: string;
    awayTeam: string;
    status: MatchStatus;
    startedAt?: number;
    score?: {
        home: number;
        away: number;
    };
    events: MatchEvent[];
    finalResult?: {
        scoreHome: number;
        scoreAway: number;
        playerRatings?: Record<string, number>;
    };
}
export type TournamentFormat = 'knockout' | 'round_robin' | 'hybrid';
export type TournamentStatus = 'draft' | 'registration' | 'active' | 'completed';
export interface Fixture {
    id: string;
    matchId: string;
    round: number;
    stageName?: string;
}
export interface Tournament {
    id: string;
    clubId: string;
    name: string;
    format: TournamentFormat;
    entryFee: number;
    isRealMoney: boolean;
    maxParticipants: number;
    targetPool?: number;
    status: TournamentStatus;
    teams: string[];
    fixtures: Fixture[];
    createdAt: number;
}
export type PredictionMode = 'points' | 'real-money';
export type PredictionMarketType = 'match_winner' | 'correct_score' | 'first_goalscorer' | 'total_goals' | 'btts' | 'player_of_the_match' | 'tournament_champion';
export interface Prediction {
    id: string;
    participantDid: string;
    marketType: PredictionMarketType;
    selection: string;
    submittedAt: number;
    signedTxRef?: string;
}
export interface PredictionPool {
    id: string;
    tournamentId?: string;
    matchId?: string;
    name: string;
    mode: PredictionMode;
    entryFee: number;
    maxParticipants: number;
    targetPool: number;
    predictions: Record<string, Prediction[]>;
    status: 'open' | 'closed' | 'resolved';
    winners?: string[];
    resolution?: {
        finalResult: string;
        payouts: Record<string, number>;
    };
}
export interface DIDChallenge {
    nonce: string;
    timestamp: number;
}
export interface DIDAuthResponse {
    did: string;
    signature: string;
    nonce: string;
}
export * from './auth';
