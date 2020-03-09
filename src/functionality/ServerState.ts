import { Team } from './Card';

export enum GamePhase {
    Connecting = 0,
    CardSelection,
    Readying,
    Countdown,
    Activity,
    Discussion,
    Results,
}

export interface ServerState {
    phase: GamePhase;
    setupPlayer: string;
    cards: string[];
    playerCards?: Record<string, string>;
    votes?: Record<string, string>;
    killedPlayers?: string[];
    winners?: Team[];
}