export type ClientToServerCommand = {
    type: 'ready';    
} | {
    type: 'select cards';
    cards: string[];
} | {
    type: 'pick player';
    target: string;
} | {
    type: 'pick players';
    target1: string;
    target2: string;
} | {
    type: 'pick card';
    target: number;
} | {
    type: 'vote';
    target: string;
}