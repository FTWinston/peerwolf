import { ClientState } from './ClientState';
import { GamePhase } from './ServerState';
import { LocalConnection, RemoteConnection, Delta } from 'peer-server';
import { ClientToServerCommand } from './ClientToServerCommand';
import { ServerToClientCommand } from './ServerToClientCommand';
import ServerWorker from './server.worker';

export class WolfClient {
    private readonly connection: LocalConnection<ClientToServerCommand, ServerToClientCommand, ClientState>
                               | RemoteConnection<ClientToServerCommand, ServerToClientCommand, ClientState>;

    constructor(
        public readonly name: string,
        host: string | undefined,
        ready: () => void,
        private readonly playersChanged: (players: string[]) => void,
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
                    playersChanged: this.playersChanged,
                },
                ready
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
                    playersChanged: this.playersChanged,
                },
                ready
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

    public get state() {
        return this.connection.clientState;
    }
}