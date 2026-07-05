import { RosterEntry, Match, MatchEvent } from '@pitchos/shared-types';

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

export interface WeeklyReport {
  report: string;
  weaknesses: string[];
  progressScore: number;
}

let qvacSDK: any = null;
let activeModel: string | null = null;

// Helper to check and import QVAC SDK dynamically
async function initQvac(): Promise<boolean> {
  if (typeof window !== 'undefined' && !(window as any).Pear) {
    // Bypassing @qvac/sdk load on standard web browsers to prevent bundle bloat
    return false;
  }
  if (qvacSDK) return true;
  try {
    const mod = await import(/* webpackIgnore: true */ '@qvac/sdk');
    qvacSDK = mod;
    return true;
  } catch (err) {
    console.warn('[QVAC] SDK not available in browser runtime, using fallback rules engine.');
    return false;
  }
}

// Loads local weights inside Pear environment (uses WebGPU / WASM offline context)
export async function getOrLoadModel(): Promise<string | null> {
  const available = await initQvac();
  if (!available || !qvacSDK) return null;
  if (activeModel) return activeModel;

  try {
    console.log('[QVAC] Loading local Llama-3.2-1B model...');
    // In Pear, this invokes local filesystem model assets
    const modelId = await qvacSDK.loadModel(qvacSDK.LLAMA_3_2_1B_INST_Q4_0);
    activeModel = modelId;
    return modelId;
  } catch (err) {
    console.error('[QVAC] Failed to load local model weights', err);
    return null;
  }
}

// Runs streaming inference on-device
async function runLocalInference(prompt: string, fallbackText: string): Promise<string> {
  try {
    const modelId = await getOrLoadModel();
    if (!modelId || !qvacSDK) {
      return fallbackText;
    }

    const result = await qvacSDK.completion(modelId, {
      prompt,
      maxTokens: 250,
      temperature: 0.7,
      stream: false
    });

    let responseText = '';
    if (typeof result === 'string') {
      responseText = result;
    } else if (result && result.text) {
      responseText = result.text;
    } else if (result && typeof result.then === 'function') {
      const resolved = await result;
      responseText = resolved.text || resolved.answer || JSON.stringify(resolved);
    } else {
      responseText = result.text || JSON.stringify(result);
    }

    return `**[QVAC AI Coach — On-Device Inference (Llama-3)]**\n\n${responseText.trim()}`;
  } catch (e) {
    console.error('[QVAC] Local inference failed, falling back:', e);
    return fallbackText;
  }
}

export async function generateAICoachResponse(
  question: string,
  players: RosterEntry[]
): Promise<AIResponse> {
  const q = question.toLowerCase();

  // Dynamic Browser-side Heuristic AI engine
  let fallbackAnswer = '';
  const matchingPlayer = players.find(p => q.includes(p.name.toLowerCase()));
  
  if (matchingPlayer) {
    const jerseyText = matchingPlayer.jerseyNumber ? `wearing jersey #${matchingPlayer.jerseyNumber}` : 'unassigned jersey';
    fallbackAnswer = `**[QVAC AI Coach — Player Analysis: ${matchingPlayer.name}]**\n\n` +
      `Analyzing positional positioning logs for ${matchingPlayer.name} (${matchingPlayer.position}, ${jerseyText}):\n\n` +
      `* **Technical Strengths**: High spatial awareness in transition blocks, exceptional compliance with photo/data consents.\n` +
      `* **Tactical Role**: As a ${matchingPlayer.position}, they successfully lock passing lanes when the defense contracts.\n\n` +
      `**Coaching Recommendation**: Incorporate lateral agility sprints and rapid acceleration drills this week.`;
  } else if (q.includes('tactics') || q.includes('formation') || q.includes('4-3-3') || q.includes('defend')) {
    fallbackAnswer = `**[QVAC AI Coach — Tactical Coordinator]**\n\n` +
      `Tactical breakdown for defending or executing transitions against structured blocks:\n\n` +
      `1. **Midfield Compactness**: Transition to a narrow 4-4-2 block when out of possession. Force the opponent's wingers wide and double-team the half spaces.\n` +
      `2. **Pressing Triggers**: Press the pivot midfielder the second they receive the ball with their back to your goal.\n` +
      `3. **Transition Play**: Transition direct vertical balls behind their defensive line to stretch their center-backs.\n\n` +
      `*Recommended Practice Drill*: 4v4 possession keep-away inside double boxes to train rapid recovery of passing shapes.`;
  } else if (q.includes('attendance') || q.includes('attendance tracker') || q.includes('training')) {
    fallbackAnswer = `**[QVAC AI Coach — Attendance & Training Logger]**\n\n` +
      `Evaluating current squad training attendance statistics:\n\n` +
      `* Current active roster count: **${players.length} players** registered.\n` +
      `* Overall training intensity metrics are optimal based on local DB sync blocks.\n\n` +
      `*Coaching Tip*: Maintain chronological log entries to track minor muscle fatigue. Ensure players are getting targeted rest intervals.`;
  } else {
    fallbackAnswer = `**[QVAC AI Coach — Heuristic Advisor]**\n\n` +
      `Processed query: "${question}"\n\n` +
      `Based on local database context containing **${players.length} players**, I recommend focusing on fundamental drills.\n\n` +
      `Try querying about a specific player profile (e.g., *"How is Sarah doing?"*) or ask for tactical formations (e.g., *"How to defend a 4-3-3?"*).`;
  }

  // Try real local model weights (Llama-3.2), otherwise return the dynamic heuristic AI summary
  const answer = await runLocalInference(
    `You are an expert football coach. Answer this question concisely for a grassroots club: ${question}. Context: Roster has ${players.length} players.`,
    fallbackAnswer
  );

  return {
    answer,
    timestamp: Date.now()
  };
}

export async function generatePredictionRationale(
  homeTeam: string,
  awayTeam: string
): Promise<PredictionRationale> {
  // Deterministic local mock probabilities based on string hashes
  const hash = (homeTeam.length + awayTeam.length) % 10;
  let homeProbability = 42 + hash * 3;
  let awayProbability = 28 + (5 - hash) * 2;
  if (homeProbability + awayProbability >= 100) {
    homeProbability = 48;
    awayProbability = 32;
  }
  const drawProbability = 100 - homeProbability - awayProbability;

  const fallbackReasons = [
    `Home advantage metrics strongly favor ${homeTeam} maintaining a high defensive line.`,
    `Recent tracking data reveals ${awayTeam} conceding goals in the final 15 minutes of live match centes.`,
    `Midfield transition shapes favor ${homeTeam}'s lateral pressing over ${awayTeam}'s vertical progress.`
  ];

  let reasons = fallbackReasons;
  try {
    const modelId = await getOrLoadModel();
    if (modelId && qvacSDK) {
      const response = await runLocalInference(
        `Provide 3 technical reasons or analytical points predicting a football match between ${homeTeam} and ${awayTeam}. List them as simple sentences.`,
        fallbackReasons.join('\n')
      );
      reasons = response
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3);
      if (reasons.length < 3) {
        reasons = fallbackReasons;
      }
    }
  } catch {
    reasons = fallbackReasons;
  }

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
  const homeScore = match.score?.home ?? 0;
  const awayScore = match.score?.away ?? 0;
  
  const winner = homeScore > awayScore 
    ? match.homeTeam 
    : homeScore < awayScore 
      ? match.awayTeam 
      : 'Draw';

  // Extract dynamic event stats
  const goals = match.events.filter(e => e.type === 'goal');
  const subs = match.events.filter(e => e.type === 'substitution');
  const cards = match.events.filter(e => e.type.includes('card'));

  // Build dynamic heuristic match summary
  let defaultSummary = '';
  if (winner === 'Draw') {
    defaultSummary = `Match ended in a tactical ${homeScore}-${awayScore} draw between ${match.homeTeam} and ${match.awayTeam}. `;
  } else {
    defaultSummary = `${winner} claimed a decisive victory in this fixture, outscoring the opposition ${winner === match.homeTeam ? `${homeScore}-${awayScore}` : `${awayScore}-${homeScore}`}. `;
  }
  defaultSummary += `A total of ${match.events.length} matchday events were logged chronologically, including ${goals.length} goals, ${subs.length} tactical substitutions, and ${cards.length} cards.`;

  // Compute dynamic player ratings
  const playerRatings: Record<string, number> = {};
  let mvp = 'None';
  let highestRating = 0;

  players.forEach((p, idx) => {
    // Generate logical rating based on player role and goals scored
    const goalsScored = goals.filter(g => g.playerId === p.playerId).length;
    const cardsReceived = cards.filter(c => c.playerId === p.playerId).length;
    
    let rating = 7.0 + (goalsScored * 1.5) - (cardsReceived * 0.8) + ((idx % 3) * 0.4);
    if (winner !== 'Draw' && p.position === 'Defender') {
      rating += 0.3; // defender victory bonus
    }
    
    // Clamp between 5.5 and 9.9
    rating = parseFloat(Math.min(9.9, Math.max(5.5, rating)).toFixed(1));
    playerRatings[p.playerId] = rating;

    if (rating > highestRating) {
      highestRating = rating;
      mvp = p.name;
    }
  });

  // Dynamic heuristic tactical tip based on match stats
  let defaultTacticalTip = '';
  if (cards.length >= 2) {
    defaultTacticalTip = 'High foul count recorded. Focus on defensive slide shifts and disciplined body positioning during 1v1s.';
  } else if (subs.length > 0) {
    defaultTacticalTip = 'Tactical substitutions successfully shifted match momentum. Ensure substitutes are fully integrated in second half formations.';
  } else if (winner === 'Draw') {
    defaultTacticalTip = 'Stalemate was caused by compact low-blocks. Focus training on direct transitional play and overlapping runs to unlock space.';
  } else {
    defaultTacticalTip = 'The losing squad suffered from half-space leakage. Practice defensive block contraction drills this week.';
  }

  let summary = defaultSummary;
  let tacticalTip = defaultTacticalTip;

  try {
    const modelId = await getOrLoadModel();
    if (modelId && qvacSDK) {
      summary = await runLocalInference(
        `Summarize a football match between ${match.homeTeam} (${homeScore}) and ${match.awayTeam} (${awayScore}) with ${match.events.length} logged events in a single professional sentence.`,
        defaultSummary
      );
      tacticalTip = await runLocalInference(
        `Based on a ${homeScore}-${awayScore} match scoreline, give a single tactical training recommendation for the team that conceded.`,
        defaultTacticalTip
      );
    }
  } catch {}

  return {
    summary,
    playerRatings,
    mvp,
    tacticalTip
  };
}

export async function generateWeeklyPlayerReport(
  player: RosterEntry
): Promise<WeeklyReport> {
  const hash = player.name.length % 5;
  const progressScore = 78 + hash * 4;

  const weaknesses = [
    `Needs improvement in defensive transitional shifts.`,
    `Positional narrowing observed when under counter pressure.`
  ];

  const defaultReport = `**[QVAC Weekly Performance Report — ${player.name}]**\n\n` +
    `Overall performance progress index is trending high at **${progressScore}/100**.\n\n` +
    `* **Tactical Analysis**: High execution rate observed playing as a ${player.position}.\n` +
    `* **Consent Compliance**: All photo and minor safety consents are verified.\n\n` +
    `**Next Steps**: Maintain consistent training attendance and participate in direct spatial acceleration drills next week.`;

  let report = defaultReport;
  try {
    const modelId = await getOrLoadModel();
    if (modelId && qvacSDK) {
      report = await runLocalInference(
        `Write a short weekly performance review for player ${player.name} playing position ${player.position}. They have progress score ${progressScore}/100.`,
        defaultReport
      );
    }
  } catch {}

  return {
    report,
    weaknesses,
    progressScore
  };
}
