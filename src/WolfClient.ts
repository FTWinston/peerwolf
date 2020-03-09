import { ClientState } from './ClientState';
import { GamePhase } from './ServerState';
import { LocalConnection, RemoteConnection, Delta, Connection } from 'peer-server';
import { ClientToServerCommand } from './ClientToServerCommand';
import { ServerToClientCommand } from './ServerToClientCommand';
import ServerWorker from './server.worker';
import { Card, Team, cardDetails, errorCard } from './Card';

export interface ClientEvents {
    ready: () => void;
    playersChanged: (players: string[]) => void;
    setupPlayerChanged: (setupPlayer: string) => void;
    cardsChanged: (cards: Card[]) => void;
    phaseChanged: (phase: GamePhase) => void;
    localPlayerCardChanged: (localPlayerCard?: Card) => void;
    playerCardsChanged: (playerCards: Record<string, Card>) => void;
    votesChanged: (votes: Record<string, string>) => void;
    killedPlayersChanged: (killedPlayers: string[]) => void;
    winnersChanged: (winners?: Team[]) => void;
}

export class WolfClient {
    private readonly connection: Connection<ClientToServerCommand, ServerToClientCommand, ClientState>;

    constructor(
        private readonly events: ClientEvents,
        public readonly name: string,
        host: string | undefined,
        
    ) {
        const initialState = {
            phase: GamePhase.CardSelection,
            setupPlayer: '',
            cards: [],
        };

        if (host) {
            this.connection = new RemoteConnection<ClientToServerCommand, ServerToClientCommand, ClientState>(
                {
                    initialState,
                    serverId: host,
                    clientName: name,
                    receiveCommand: cmd => this.receiveCommand(cmd),
                    receiveError: msg => console.error(msg),
                    playersChanged: this.events.playersChanged,
                    stateChanged: (prevState, delta) => this.stateChanged(prevState, delta),
                },
                this.events.ready
            );
        }
        else {
            this.connection = new LocalConnection<ClientToServerCommand, ServerToClientCommand, ClientState>(
                {
                    initialState,
                    clientName: name,
                    worker: new ServerWorker(),
                    receiveCommand: cmd => this.receiveCommand(cmd),
                    receiveError: msg => console.error(msg),
                    playersChanged: this.events.playersChanged,
                    stateChanged: (prevState, delta) => this.stateChanged(prevState, delta),
                },
                this.events.ready
            )
        }
    }

    private receiveCommand(command: ServerToClientCommand): Delta<ClientState> | undefined {
        switch (command.type) {
            case 'setup':
                return {
                    setupPlayer: command.player,
                    phase: GamePhase.CardSelection,
                };

            case 'chosen cards':
                return {
                    cards: command.cards,
                }
                
            case 'get ready':
                return {
                    phase: GamePhase.Readying,
                    votes: {},
                    killedPlayers: undefined,
                    localPlayerCard: undefined,
                    playerCards: undefined,
                    winners: undefined,
                }
                
            case 'ready':
                return {
                    votes: {
                        [command.player]: ''
                    }
                }
                
            case 'assign':
                return {
                    localPlayerCard: command.card,
                }
                
            case 'start':
                // TODO: get countdown going somehow
                const endTime = performance.now() + command.duration * 1000;
                return {
                    phase: GamePhase.Activity,
                    votes: undefined,
                }
                
            case 'reveal':
                return {
                    playerCards: {
                        [command.player]: command.card,
                    }
                };
                
            case 'vote':
                return {
                    votes: {
                        [command.voter]: command.target,
                    }
                };
                
            case 'result':
                return {
                    phase: GamePhase.Results,
                    killedPlayers: command.killed,
                    playerCards: command.playerCards,
                    winners: command.winners,
                };
        }
    }

    public stateChanged(prevState: Readonly<ClientState>, delta: Delta<ClientState>) {
        const state = this.connection.clientState;

        if (prevState.setupPlayer !== state.setupPlayer) {
            this.events.setupPlayerChanged(state.setupPlayer);
        }

        if (prevState.cards !== state.cards) {
            const cards = state.cards.map(this.getCard);
            this.events.cardsChanged(cards);
        }

        if (prevState.phase !== state.phase) {
            this.events.phaseChanged(state.phase);
        }

        if (prevState.localPlayerCard !== state.localPlayerCard) {
            const card = state.localPlayerCard
                ? this.getCard(state.localPlayerCard)
                : undefined;

            this.events.localPlayerCardChanged(card);
        }
        
        if (prevState.playerCards !== state.playerCards) {
            if (state.playerCards === undefined) {
                this.events.playerCardsChanged({});
            }
            else {
                const playerCards: Record<string, Card> = {};
                for (const player in state.playerCards) {
                    playerCards[player] = this.getCard(state.playerCards[player]);
                }
                this.events.playerCardsChanged(playerCards);
            }
        }
        
        if (prevState.votes !== state.votes) {
            this.events.votesChanged(state.votes ?? {});
        }
        
        if (prevState.killedPlayers !== state.killedPlayers) {
            this.events.killedPlayersChanged(state.killedPlayers ?? []);
        }
        
        if (prevState.winners !== state.winners) {
            this.events.winnersChanged(state.winners);
        }
    }

    private getCard(card: string) {
        return cardDetails.get(card) ?? errorCard;
    }
}