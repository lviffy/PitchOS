export interface PlaybookEntry {
  id: string;
  category: 'formation' | 'drill' | 'referee' | 'general';
  title: string;
  content: string;
  keywords: string[];
}

export const PLAYBOOKS: PlaybookEntry[] = [
  {
    id: 'form-433',
    category: 'formation',
    title: '4-3-3 Attacking System & Pressing Triggers',
    content: 'The 4-3-3 system utilizes high-pressing wingers and a single holding defensive midfielder (pivot). Defensively, pressing triggers occur when the opponent’s center-back plays a slow lateral pass to a fullback. The winger seals the touchline, the attacking midfielder shifts to mark the pivot, and the holding midfielder screens the passing lanes to the striker. Offensively, wingers stretch the pitch wide to isolate opposing fullbacks in 1v1 situations.',
    keywords: ['4-3-3', 'press', 'winger', 'pivot', 'attacking', 'pressing triggers']
  },
  {
    id: 'form-352',
    category: 'formation',
    title: '3-5-2 Wingback Overlap & Defensive Recovery',
    content: 'The 3-5-2 system relies on dynamic wingbacks to cover the entire flank. Offensively, wingbacks push high, creating overlaps with the two strikers while midfielders cover the half-spaces. Defensively, when possession is lost, wingbacks rapidly drop back to form a 5-3-2 low block. Center-backs must remain compact, sliding horizontally to cover the channels while the defensive midfielders block central zones.',
    keywords: ['3-5-2', 'wingback', 'overlap', 'low block', 'back three', 'recovery']
  },
  {
    id: 'drill-rondo',
    category: 'drill',
    title: '4v4 + 2 Neutral Transition Rondo Drill',
    content: 'Setup a 15x15 yard grid. Place two neutral players inside the grid (acting as pivot midfielders). Two teams of 4 compete. The team in possession attempts to execute 6 consecutive passes including at least one neutral player transition before looking to switch the ball. When defenders win the ball, they must immediately pass to a neutral player to trigger a transition. Teaches rapid defensive contraction and possession recovery.',
    keywords: ['rondo', 'drill', 'neutral', 'possession', 'transition', 'passing shape']
  },
  {
    id: 'drill-pressing',
    category: 'drill',
    title: 'Midfield Pressing & Counter-Attack Grid Drill',
    content: 'Divide the pitch middle third into three horizontal zones. The possession squad plays 5v3 in the central zone. Two opposing wingers wait in the wide zones. The defensive unit must compress space, intercept a pass, and execute an immediate vertical outlet pass to one of the wide wingers to initiate a 3v2 counter-attack on goal. Focuses on spatial compression and immediate forward transition.',
    keywords: ['drill', 'midfield pressing', 'pressing', 'counter-attack', 'compression']
  },
  {
    id: 'ref-offside',
    category: 'referee',
    title: 'FIFA Offside Rule & Defensive Line Coordination',
    content: 'According to FIFA Law 11, a player is in an offside position if they are nearer to the opponent’s goal line than both the ball and the second-last opponent at the moment the ball is played to them. To coordinate offside traps, the defensive line must act cohesively. The central defender commands the line, ordering a collective forward step (squeeze) the moment the opposing midfielder initiates a back-pass or faces heavy pressure with their back to goal.',
    keywords: ['offside', 'referee', 'rules', 'defensive line', 'offside trap', 'law 11']
  },
  {
    id: 'general-intensity',
    category: 'general',
    title: 'Training Intensity & Muscle Fatigue Management',
    content: 'Maintain high training intensity for a maximum of 90 minutes. Follow the rule of tactical periodization: alternating strength, endurance, and reaction days with dedicated recovery intervals. Record minor muscle strain logs chronologically. If a player reports grade 1 tightness, reduce high-speed running drills and substitute with low-impact recovery or tactical positional walks.',
    keywords: ['intensity', 'fatigue', 'recovery', 'training duration', 'muscle strain', 'injury prevention']
  }
];
