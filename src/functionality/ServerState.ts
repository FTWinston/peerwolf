import { Team } from './Card';

export enum GamePhase {
    CardSelection = 1,
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