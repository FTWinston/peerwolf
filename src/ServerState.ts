import { Team } from './Card';

export enum GamePhase {
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
    playerCards?: Record<string, number>;
    votes?: Record<string, string>;
    killedPlayers?: string[];
    winners?: Team;
}