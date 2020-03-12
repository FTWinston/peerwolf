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

export const numExtraCards = 3;

export const minPlayers = 3;
export const maxPlayers = 8;

export interface ServerState {
    phase: GamePhase;
    setupPlayer: string;
    cards: string[];
    playerCards?: Record<string, string>;
    votes?: Record<string, string>;
    killedPlayers?: string[];
    winners?: Team[];
}