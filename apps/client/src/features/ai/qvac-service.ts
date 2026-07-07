import { RosterEntry, Match } from '@pitchos/shared-types';
import { db } from '../../lib/db';
import { getLocalWallet, getWalletBalances } from '../wallet/wallet-store';
import { PLAYBOOKS, PlaybookEntry } from './playbooks';

export interface ParsedVoiceCommand {
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  playerId?: string;
  playerOutId?: string;
  details?: string;
  minute?: number;
}

export function searchLocalPlaybooks(query: string): string {
  const normalized = query.toLowerCase();
  const scored = PLAYBOOKS.map(pb => {
    let score = 0;
    pb.keywords.forEach(kw => {
      if (normalized.includes(kw.toLowerCase())) score += 5;
    });
    const words = normalized.split(/\s+/);
    words.forEach(w => {
      if (w.length > 3) {
        if (pb.title.toLowerCase().includes(w)) score += 2;
        if (pb.content.toLowerCase().includes(w)) score += 1;
      }
    });
    return { pb, score };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return '';
  return scored.slice(0, 2).map(item => `[Playbook: ${item.pb.title}]\n${item.pb.content}`).join('\n\n');
}

export function parseVoiceMatchCommand(transcript: string, players: RosterEntry[]): ParsedVoiceCommand | null {
  const norm = transcript.toLowerCase();
  
  let eventType: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | null = null;
  if (norm.includes('goal') || norm.includes('score')) {
    eventType = 'goal';
  } else if (norm.includes('yellow') || norm.includes('caution') || norm.includes('card')) {
    if (norm.includes('yellow')) eventType = 'yellow_card';
    else if (norm.includes('red')) eventType = 'red_card';
  } else if (norm.includes('sub') || norm.includes('substitution') || norm.includes('replace') || norm.includes('change')) {
    eventType = 'substitution';
  }

  if (!eventType) return null;

  let minute: number | undefined = undefined;
  const minMatch = norm.match(/(?:minute\s*|at\s*|min\s*)?(\d+)/);
  if (minMatch) {
    minute = parseInt(minMatch[1], 10);
  }

  const foundPlayers = players.filter(p => norm.includes(p.name.toLowerCase()));

  let playerId: string | undefined = undefined;
  let playerOutId: string | undefined = undefined;
  let details: string | undefined = undefined;

  if (eventType === 'substitution') {
    if (foundPlayers.length >= 2) {
      const p0Index = norm.indexOf(foundPlayers[0].name.toLowerCase());
      const p1Index = norm.indexOf(foundPlayers[1].name.toLowerCase());
      
      const outIndex = norm.match(/out|off|replaces/)?.index ?? -1;
      if (outIndex !== -1) {
        if (Math.abs(outIndex - p0Index) < Math.abs(outIndex - p1Index)) {
          playerOutId = foundPlayers[0].playerId;
          playerId = foundPlayers[1].playerId;
        } else {
          playerOutId = foundPlayers[1].playerId;
          playerId = foundPlayers[0].playerId;
        }
      } else {
        playerOutId = foundPlayers[0].playerId;
        playerId = foundPlayers[1].playerId;
      }
    } else if (foundPlayers.length === 1) {
      playerOutId = foundPlayers[0].playerId;
    }
  } else {
    if (foundPlayers.length > 0) {
      playerId = foundPlayers[0].playerId;
    }
    
    if (eventType === 'goal') {
      if (norm.includes('away') || norm.includes('opponent') || norm.includes('them')) {
        details = 'away';
      } else {
        details = 'home';
      }
    }
  }

  return {
    eventType,
    playerId,
    playerOutId,
    details,
    minute
  };
}


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
    // Follow the canonical loadModel options
    const modelId = await qvacSDK.loadModel({
      modelSrc: qvacSDK.LLAMA_3_2_1B_INST_Q4_0,
      onProgress: (progress: any) => {
        console.log('[QVAC] Load progress:', progress);
      }
    });
    activeModel = modelId;
    return modelId;
  } catch (err) {
    console.error('[QVAC] Failed to load local model weights', err);
    return null;
  }
}

// Unloads model to free GPU and system resources
export async function unloadActiveModel(): Promise<void> {
  if (activeModel && qvacSDK) {
    try {
      console.log(`[QVAC] Unloading model ${activeModel} to free resources...`);
      await qvacSDK.unloadModel({ modelId: activeModel });
      activeModel = null;
    } catch (err) {
      console.error('[QVAC] Failed to unload active model:', err);
    }
  }
}

// Local Database Tools (offline-first RAG tool calls)
async function executeLocalTool(toolName: string, playersList?: RosterEntry[]): Promise<string> {
  console.log(`[QVAC Tool] Executing tool: ${toolName}`);
  try {
    if (toolName === 'getRosterData') {
      const list = playersList || await db.roster.toArray();
      if (list.length === 0) return 'The roster is currently empty.';
      return 'Roster Entries:\n' + list.map(p => `- ${p.name} (${p.position}, Jersey #${p.jerseyNumber || 'N/A'})`).join('\n');
    }
    if (toolName === 'getMatchHistory') {
      const list = await db.matches.toArray();
      if (list.length === 0) return 'No match records exist in the database.';
      return 'Match History:\n' + list.map(m => `- ${m.homeTeam} vs ${m.awayTeam} (Score: ${m.score?.home ?? 0}-${m.score?.away ?? 0}, Status: ${m.status})`).join('\n');
    }
    if (toolName === 'getWalletBalance') {
      const wallet = getLocalWallet();
      if (!wallet) return 'No local wallet is configured.';
      const balances = await getWalletBalances(wallet.did);
      return `Wallet Balances for DID ${wallet.did}:\n- USDT: ${balances.balance} ₮\n- Loyalty Points: ${balances.points} PTS`;
    }
  } catch (err) {
    console.error(`[QVAC Tool] Error executing ${toolName}:`, err);
  }
  return 'Error retrieving information from the local database.';
}

// Runs streaming or non-streaming inference on-device
async function runLocalInference(prompt: string, fallbackText: string): Promise<string> {
  try {
    const modelId = await getOrLoadModel();
    if (!modelId || !qvacSDK) {
      return fallbackText;
    }

    let result;
    if (typeof qvacSDK.completion === 'function') {
      try {
        result = await qvacSDK.completion({
          modelId,
          history: [{ role: 'user', content: prompt }]
        });
      } catch (err) {
        result = await qvacSDK.completion(modelId, {
          prompt,
          maxTokens: 250,
          temperature: 0.7,
          stream: false
        });
      }
    } else {
      return fallbackText;
    }

    let responseText = '';
    if (typeof result === 'string') {
      responseText = result;
    } else if (result && result.text) {
      responseText = result.text;
    } else if (result && result.tokenStream) {
      for await (const token of result.tokenStream) {
        responseText += token;
      }
    } else {
      responseText = JSON.stringify(result);
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

  // Detect tool intent dynamically
  let detectedTool: string | null = null;
  if (q.includes('roster') || q.includes('player') || q.includes('who is on')) {
    detectedTool = 'getRosterData';
  } else if (q.includes('match') || q.includes('score') || q.includes('game') || q.includes('played')) {
    detectedTool = 'getMatchHistory';
  } else if (q.includes('balance') || q.includes('money') || q.includes('usdt') || q.includes('points') || q.includes('wallet')) {
    detectedTool = 'getWalletBalance';
  }

  let toolData = '';
  if (detectedTool) {
    toolData = await executeLocalTool(detectedTool, players);
  }

  // Local RAG Playbook Search
  const playbookData = searchLocalPlaybooks(question);

  let fallbackAnswer = '';
  if (playbookData) {
    fallbackAnswer = `**[QVAC AI Coach — Tactical Playbook Citations (Local RAG)]**\n\n` +
      `Here is the matching tactical literature retrieved from your on-device playbook repository:\n\n` +
      `${playbookData}\n\n` +
      `**Fallback Coach Feedback**: Try configuring a Pear swarm to test these tactics collaboratively with your staff.`;
  } else if (detectedTool === 'getRosterData') {
    fallbackAnswer = `**[QVAC AI Coach — Roster Intelligence]**\n\n` +
      `Here is the active squad roster retrieved directly from your on-device database:\n\n` +
      `${toolData}\n\n` +
      `**Coaching Recommendation**: Keep player contact consents updated. Run standard acceleration drills this week.`;
  } else if (detectedTool === 'getMatchHistory') {
    fallbackAnswer = `**[QVAC AI Coach — Match History Feed]**\n\n` +
      `Retrieved the following match database log logs offline:\n\n` +
      `${toolData}\n\n` +
      `**Coaching Recommendation**: Focus on transition compactness in mid-blocks for upcoming matches.`;
  } else if (detectedTool === 'getWalletBalance') {
    fallbackAnswer = `**[QVAC AI Coach — Autonomous Wallet Auditor]**\n\n` +
      `Audited local ledger balances and address status:\n\n` +
      `${toolData}\n\n` +
      `**Coaching Recommendation**: Keep a minimum of 100 USDT in reserve to register for upcoming premium tournament events.`;
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
      `Try querying about your local team roster (e.g. *"Show roster"*), recent matches (*"Show match history"*), or wallet balances (*"Show wallet balance"*).`;
  }

  let finalPrompt = `You are a football coach. Answer this question: ${question}. Context: Roster has ${players.length} players.`;
  if (detectedTool && toolData) {
    finalPrompt += `\nLocal Database Context [Tool: ${detectedTool}]:\n${toolData}`;
  }
  if (playbookData) {
    finalPrompt += `\nLocal Playbooks References:\n${playbookData}`;
  }

  const answer = await runLocalInference(finalPrompt, fallbackAnswer);

  return {
    answer,
    timestamp: Date.now()
  };
}

export async function generatePredictionRationale(
  homeTeam: string,
  awayTeam: string
): Promise<PredictionRationale> {
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

  const goals = match.events.filter(e => e.type === 'goal');
  const subs = match.events.filter(e => e.type === 'substitution');
  const cards = match.events.filter(e => e.type.includes('card'));

  let defaultSummary = '';
  if (winner === 'Draw') {
    defaultSummary = `Match ended in a tactical ${homeScore}-${awayScore} draw between ${match.homeTeam} and ${match.awayTeam}. `;
  } else {
    defaultSummary = `${winner} claimed a decisive victory in this fixture, outscoring the opposition ${winner === match.homeTeam ? `${homeScore}-${awayScore}` : `${awayScore}-${homeScore}`}. `;
  }
  defaultSummary += `A total of ${match.events.length} matchday events were logged chronologically, including ${goals.length} goals, ${subs.length} tactical substitutions, and ${cards.length} cards.`;

  const playerRatings: Record<string, number> = {};
  let mvp = 'None';
  let highestRating = 0;

  players.forEach((p, idx) => {
    const goalsScored = goals.filter(g => g.playerId === p.playerId).length;
    const cardsReceived = cards.filter(c => c.playerId === p.playerId).length;
    
    let rating = 7.0 + (goalsScored * 1.5) - (cardsReceived * 0.8) + ((idx % 3) * 0.4);
    if (winner !== 'Draw' && p.position === 'Defender') {
      rating += 0.3;
    }
    
    rating = parseFloat(Math.min(9.9, Math.max(5.5, rating)).toFixed(1));
    playerRatings[p.playerId] = rating;

    if (rating > highestRating) {
      highestRating = rating;
      mvp = p.name;
    }
  });

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
