import { Server, ClientInfo, Delta } from 'peer-server';
import { ServerWorkerMessageOut } from 'peer-server/ServerWorkerMessageOut';
import { ServerState, GamePhase } from './ServerState';
import { ClientState } from './ClientState';
import { ClientToServerCommand } from './ClientToServerCommand';
import { ServerToClientCommand } from './ServerToClientCommand';
import { cardDetails, Team } from './Card';
import { shuffle } from './Random';

const maxPlayers = 8;

export class WolfServer extends Server<ServerState, ClientState, ClientToServerCommand, ServerToClientCommand> {
    constructor(sendMessage: (message: ServerWorkerMessageOut<ServerToClientCommand, ClientState>) => void) {
        super({
            phase: GamePhase.CardSelection,
            setupPlayer: '',
            cards: []
        }, sendMessage);
    }

    getJoinError(client: ClientInfo) {
        if (this.clients.size >= maxPlayers) {
            return 'This game is full';
        }

        if (this.state.phase > GamePhase.Readying) {
            return 'This game has already started';
        }

        return super.getJoinError(client);
    }

    clientJoined(client: ClientInfo): Delta<ServerState> | undefined {
        if (this.state.phase === GamePhase.CardSelection) {
            // if no setup player already, this first player must be the setup player.
            if (this.state.setupPlayer === '') {
                this.sendCommand(client, {
                    type: 'setup',
                    player: client.name,
                });
                
                return {
                    setupPlayer: client.name,
                };
            }

            // Otherwise, tell the new player who's setting up.
            else {        
                this.sendCommand(client, {
                    type: 'setup',
                    player: this.state.setupPlayer,
                });

                this.sendCommand(client, {
                    type: 'chosen cards',
                    cards: this.state.cards,
                });
            }
        }

        // If readying, someone joining upsets the chosen number of cards, so need to step back.
        else if (this.state.phase === GamePhase.Readying) {
            this.sendCommand(undefined, {
                type: 'setup',
                player: this.state.setupPlayer,
            });

            return {
                phase: GamePhase.CardSelection,
                votes: undefined,
            }
        }
    }

    protected receiveCommandFromClient(client: ClientInfo, command: ClientToServerCommand): Delta<ServerState> | undefined {
        switch (command.type) {
            case 'select cards':
                return this.receiveCardSelection(client, command.cards);
            case 'ready':
                return this.receiveReady(client);
            case 'pick card':
            case 'pick player':
            case 'pick players': // TODO: resolve these depending on the player's allocated card
                break;
            case 'vote':
                return this.receiveVote(client, command.target);
        }
    }
    
    private receiveCardSelection(client: ClientInfo, cards: string[]): Delta<ServerState> | undefined {
        if (this.state.phase !== GamePhase.CardSelection || client.name !== this.state.setupPlayer) {
            return;
        }

        for (const card of cards) {
            if (!cardDetails.has(card)) {
                return;
            }
        }

        return {
            cards
        };
    }

    private receiveReady(client: ClientInfo): Delta<ServerState> | undefined {
        if (this.state.phase === GamePhase.Readying) {
            // When readying, tell everyone that this player as ready.
            this.sendCommand(undefined, {
                type: 'ready',
                player: client.name,
            });

            // If all players are now ready, start the game and clear the "ready" votes.
            if (this.state.votes && Object.keys(this.state.votes).length >= this.clients.size - 1) {
                setTimeout(() => this.startGame(), 3000);

                return {
                    phase: GamePhase.Countdown,
                    votes: undefined,
                }
            }

            // Otherwise, just record this player's vote.
            return {
                votes: {
                    [client.name]: ''
                }
            };
        }
        else if (this.state.phase === GamePhase.CardSelection && client.name === this.state.setupPlayer) {
            // In card selection, the setup player indicates they are done selecting by sending ready.
            // So send (and mark) this player as ready, and advance to the readying phase.
            this.sendCommand(undefined, {
                type: 'get ready',
            });
            
            this.sendCommand(undefined, {
                type: 'ready',
                player: client.name,
            });

            return {
                phase: GamePhase.Readying,
                votes: {
                    [client.name]: ''
                }
            };
        }
    }
 
    private receiveVote(client: ClientInfo, target: string): Delta<ServerState> | undefined {
        if (this.state.phase === GamePhase.Activity) {
            return {
                votes: {
                    [client.name]: target
                }
            };
        }
    }

    private startGame() {
        const playerCards = this.allocateCards();

        // Send assign message to each player.
        for (const [_, client] of this.clients) {
            const cardIndex = playerCards[client.name];
            if (cardIndex !== undefined) {
                const cardName = this.state.cards[cardIndex];
                if (cardName !== undefined) {
                    this.sendCommand(client, {
                        type: 'assign',
                        card: cardName,
                    });
                }
            }
        }

        const durationSecs = 120;

        this.sendCommand(undefined, {
            type: 'start',
            duration: durationSecs,
        });

        this.updateState({
            phase: GamePhase.Activity,
            playerCards,
            votes: {},
            winners: undefined,
        });

        setTimeout(() => this.finishGame(), durationSecs * 1000);
    }

    private allocateCards() {
        const indices = this.state.cards.map((_, i) => i);
        shuffle(indices);

        const results: Record<string, number> = {}
        let nextIndex = 0;

        for (const [_, client] of this.clients) {
            if (nextIndex >= indices.length) {
                break; // oops?
            }

            results[client.name] = indices[nextIndex++];
        }

        return results;
    }

    private finishGame() {
        const killedPlayers = this.tallyVotes();
        const winningTeams = this.determineWinners(killedPlayers);
        
        this.sendCommand(undefined, {
            type: 'result',
            killed: killedPlayers,
            winners: winningTeams,
            playerCards: this.state.playerCards ?? {},
        });

        this.updateState({
            phase: GamePhase.Results,
            winners: winningTeams,
            killedPlayers: killedPlayers,
        });

        setTimeout(() => this.readyForNextGame(), 5000);
    }

    private tallyVotes() {
        const votes = new Map<string, number>();

        for (const voter in this.state.votes) {
            const target = this.state.votes[voter];
            let total = votes.get(target);

            total = total === undefined
                ? 1
                : total + 1;
            votes.set(target, total);
        }

        let mostVotes = 1;
        for (const [_, total] of votes) {
            mostVotes = Math.max(mostVotes, total);
        }

        const mostVoted: string[] = [];
        for (const [target, total] of votes) {
            if (total === mostVotes) {
                mostVoted.push(target);
            }
        }

        return mostVoted;
    }

    private determineWinners(killedPlayers: string[]) : Team[] {
        const teamIs = (player: string, team: Team) => {
            const cardIndex = this.state.playerCards && this.state.playerCards[player];
            if (cardIndex === undefined) {
                return false;
            }

            const cardName = this.state.cards[cardIndex];
            if (!cardName) {
                return false;
            }

            const card = cardDetails.get(cardName);
            if (!card) {
                return false;
            }

            return card.team === team;
        }
        
        const anyMonsterKilled = killedPlayers.some(player => teamIs(player, 'monsters'));
        const tannerKilled = killedPlayers.some(player => teamIs(player, 'tanner'));

        if (tannerKilled) {
            if (anyMonsterKilled) {
                return ['humans', 'tanner'];
            }

            return ['tanner'];
        }

        return anyMonsterKilled
            ? ['humans']
            : ['monsters'];
    }

    private readyForNextGame() {
        this.sendCommand(undefined, {
            type: 'get ready',
        });
        
        this.updateState({
            phase: GamePhase.Readying,
            votes: {},
            playerCards: undefined,
            winners: undefined,
            killedPlayers: undefined,
        });
    }
}