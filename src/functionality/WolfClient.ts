import { ClientState } from './ClientState';
import { GamePhase } from './ServerState';
import { LocalConnection, RemoteConnection, Connection, Delta } from 'peer-server';
import { ClientToServerCommand } from './ClientToServerCommand';
import { ServerToClientCommand } from './ServerToClientCommand';
import ServerWorker from './server.worker';

export class WolfClient {
    private readonly connection: Connection<ClientToServerCommand, ServerToClientCommand, ClientState>;

    constructor(
        private readonly playersChanged: (players: string[]) => void,
        private readonly stateChanged: (state: ClientState) => void,
        private readonly name: string,
        host: string | undefined,
        
    ) {
        const initialState = {
            phase: GamePhase.Connecting,
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
                    stateChanged: () => this.stateChanged(this.connection.clientState),
                },
                () => {
                    this.connection.updateState({
                        phase: GamePhase.CardSelection,
                    });
                }
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
                    stateChanged: () => this.stateChanged(this.connection.clientState),
                },
                () => {
                    this.connection.updateState({
                        phase: GamePhase.CardSelection,
                    });
                }
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

    public sendCommand(command: ClientToServerCommand) {
        this.connection.sendCommand(command);
    }

    public disconnect() {
        this.connection.disconnect();
    }
}