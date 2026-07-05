import { RosterEntry, Match } from '@pitchos/shared-types';

export interface AIResponse {
  answer: string;
  timestamp: number;
}

export interface PredictionRationale {
  homeProbability: number;
  awayProbability: number;
  drawProbability: number;
  confidence: 'High' | 'Medium' | 'Low';
  reasons: string[];
}

export interface MatchAnalysis {
  summary: string;
  playerRatings: Record<string, number>;
  mvp: string;
  tacticalTip: string;
}

// Helper to simulate a network-free on-device inference delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateAICoachResponse(
  question: string,
  players: RosterEntry[]
): Promise<AIResponse> {
  await delay(800); // Simulate local CPU inference delay

  const q = question.toLowerCase();

  // Search if the user is asking about a specific player
  const matchingPlayer = players.find(p => q.includes(p.name.toLowerCase()));
  if (matchingPlayer) {
    const statsDesc = matchingPlayer.jerseyNumber 
      ? `Jersey #${matchingPlayer.jerseyNumber}, playing position ${matchingPlayer.position}` 
      : `Playing position ${matchingPlayer.position}`;
    return {
      answer: `**[QVAC AI Coach — Player Profile Analysis: ${matchingPlayer.name}]**\n\n` +
        `Based on our current on-device logs, ${matchingPlayer.name} (${statsDesc}) shows solid technical execution. \n\n` +
        `**Key Strengths:**\n` +
        `- Causal positioning adjustments observed during matches.\n` +
        `- High attendance reliability recorded in local sync logs.\n\n` +
        `**Recommendation:** Focus training on lateral deceleration and precision ball delivery to maximize their role as a ${matchingPlayer.position}.`,
      timestamp: Date.now()
    };
  }

  // Tactical formations query
  if (q.includes('4-3-3') || q.includes('formation') || q.includes('tactics') || q.includes('defend')) {
    return {
      answer: `**[QVAC AI Coach — Tactical Assistant]**\n\n` +
        `To counter or organize a balanced shape (like defending a 4-3-3):\n\n` +
        `**1. Defensive Shape:**\n` +
        `- Transition to a compact 4-4-2 block. The midfield four must squeeze space between lines to prevent wingers from cutting inside.\n\n` +
        `**2. Pressing Strategy:**\n` +
        `- Trigger high-press when the opponent's holding midfielder receives the ball facing their own goal.\n\n` +
        `**3. Recommended Drills:**\n` +
        `- *3v3 Transistional Possession*: Squeezing midfield passing lanes.\n` +
        `- *Defensive Shift Drill*: Backline moves in cohesion relative to ball location.`,
      timestamp: Date.now()
    };
  }

  // Default response
  return {
    answer: `**[QVAC AI Coach — General Feedback]**\n\n` +
      `"I processed your query: '${question}'. \n\n` +
      `Our on-device model recommends focusing on fundamental transition plays. Ensure your backline maintains causal log synchronization (communication) on and off the field. \n\n` +
      `Try asking about a specific roster player by name (e.g. 'How is Sarah doing?') or ask for tactical advice (e.g. 'How to defend a 4-3-3?')."`,
    timestamp: Date.now()
  };
}

export async function generatePredictionRationale(
  homeTeam: string,
  awayTeam: string
): Promise<PredictionRationale> {
  await delay(600); // Simulate on-device inference

  // Basic deterministic probability generator based on team name strings
  const hash = (homeTeam.length + awayTeam.length) % 10;
  
  let homeProbability = 40 + hash * 3;
  let awayProbability = 30 + (5 - hash) * 2;
  if (homeProbability + awayProbability >= 100) {
    homeProbability = 50;
    awayProbability = 35;
  }
  const drawProbability = 100 - homeProbability - awayProbability;

  const reasons = [
    `On-device logs indicate ${homeTeam} has higher overall player availability in the active roster.`,
    `Recent matches show ${awayTeam} conceding early goals in the first half timeline.`,
    `Deterministic form analysis favors a compact structure for ${homeTeam} at home.`
  ];

  return {
    homeProbability,
    awayProbability,
    drawProbability,
    confidence: homeProbability > 55 ? 'High' : 'Medium',
    reasons
  };
}

export async function generateMatchPostAnalysis(
  match: Match,
  players: RosterEntry[]
): Promise<MatchAnalysis> {
  await delay(1200); // Deeper on-device analysis simulation

  const homeScore = match.score?.home ?? 0;
  const awayScore = match.score?.away ?? 0;
  const winner = homeScore > awayScore 
    ? match.homeTeam 
    : homeScore < awayScore 
      ? match.awayTeam 
      : 'Draw';

  const summary = `Match ended in a ${homeScore}-${awayScore} scoreline (${winner === 'Draw' ? 'stalemate' : `${winner} victory`}). ` +
    `Live Match Center events logged ${match.events.length} chronological actions. Compact structures were maintained.`;

  // Generate ratings for current roster players
  const playerRatings: Record<string, number> = {};
  let mvp = 'None';
  let highestRating = 0;

  players.forEach((p, idx) => {
    // Generate a rating between 6.0 and 9.5
    const seed = (p.name.length + idx) % 4;
    const rating = parseFloat((6.5 + seed * 0.8 + (winner !== 'Draw' ? 0.5 : 0)).toFixed(1));
    playerRatings[p.playerId] = rating;

    if (rating > highestRating) {
      highestRating = rating;
      mvp = p.name;
    }
  });

  const tacticalTip = winner === 'Draw'
    ? 'Both teams struggled to break mid-blocks. Transition drills with rapid wing switching recommended.'
    : `${winner} excelled in utilizing width. The losing side must reinforce half-space coverage.`;

  return {
    summary,
    playerRatings,
    mvp,
    tacticalTip
  };
}

export interface WeeklyReport {
  report: string;
  weaknesses: string[];
  progressScore: number;
}

export async function generateWeeklyPlayerReport(
  player: RosterEntry
): Promise<WeeklyReport> {
  await delay(700);

  // Deterministic generator based on name
  const hash = player.name.length % 5;
  const progressScore = 75 + hash * 4;

  const weaknesses = [
    `Needs improvement in first-touch deceleration.`,
    `Tends to drift out of position during defensive shifts.`
  ];

  const report = `**[QVAC Weekly Performance Report — ${player.name}]**\n\n` +
    `Overall performance rating is positive this week, trending at **${progressScore}/100** progress index. \n\n` +
    `**Key Technique Metrics:**\n` +
    `- Logged attendance metrics show consistent training reliability.\n` +
    `- Position adjustments as a ${player.position} indicate high tactical awareness.\n\n` +
    `**Next Week Actions:**\n` +
    `Focus on transitional speed drills and lateral acceleration exercises.`;

  return {
    report,
    weaknesses,
    progressScore
  };
}
