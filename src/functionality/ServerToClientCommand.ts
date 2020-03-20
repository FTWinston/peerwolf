import { Team } from './Card';

export type ServerToClientCommand = {
    type: 'setup';
    player: string;
} | {
    type: 'chosen cards';
    cards: string[];
} | {
    type: 'get ready';
} | {
    type: 'ready';
    players: string[];
} | {
    type: 'assign';
    card: string;
} | {
    type: 'start';
    duration: number;
} | {
    type: 'reveal';
    player: string;
    card: string;
} | {
    type: 'vote';
    voter: string;
    target: string;
} | {
    type: 'result';
    winners: Team[];
    killed: string[];
    playerCards: Record<string, string>;
}