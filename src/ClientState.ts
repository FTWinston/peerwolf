import { Team } from './Card';
import { GamePhase } from './ServerState';

export interface ClientState {
    phase: GamePhase;
    setupPlayer: string;
    localPlayerCard?: string;
    cards: string[];
    playerCards?: Record<string, string>;
    votes?: Record<string, string>;
    killedPlayers?: string[];
    winners?: Team[];
}