import { Server } from 'peer-server/lib/Server';
import { ClientInfo, Delta, ServerWorkerMessageOut } from 'peer-server';
import { ServerState, GamePhase, numExtraCards, maxPlayers, minPlayers } from './ServerState';
import { ClientState } from './ClientState';
import { ClientToServerCommand } from './ClientToServerCommand';
import { ServerToClientCommand } from './ServerToClientCommand';
import { cardDetails, Team } from './Card';
import { shuffle } from './Random';
import { timingSafeEqual } from 'crypto';

export class WolfServer extends Server<ServerState, ClientState, ClientToServerCommand, ServerToClientCommand> {
    constructor(sendMessage: (message: ServerWorkerMessageOut<ServerToClientCommand, ClientState>) => void) {
        super({
            phase: GamePhase.Connecting,
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
        if (this.state.phase === GamePhase.Connecting) {
            this.sendCommand(client, {
                type: 'setup',
                player: client.name,
            });
            
            return {
                phase: GamePhase.CardSelection,
                setupPlayer: client.name,
            };
        }
        
        // Tell the new player who's setting up, and what cards are in play.
        this.sendCommand(client, {
            type: 'setup',
            player: this.state.setupPlayer,
        });

        this.sendCommand(client, {
            type: 'chosen cards',
            cards: this.state.cards,
        });

        // If readying, someone joining upsets the chosen number of cards, so need to step back.
        if (this.state.phase === GamePhase.Readying) {
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
                return this.receiveReady(client, command.ready);
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

        this.sendCommand(undefined, {
            type: 'chosen cards',
            cards,
        });

        return {
            cards
        };
    }

    private receiveReady(client: ClientInfo, isReady: boolean): Delta<ServerState> | undefined {
        if (this.state.phase === GamePhase.Readying) {
            if (isReady) {
                // When readying, tell everyone that this player is ready.
                this.sendCommand(undefined, {
                    type: 'ready',
                    players: this.state.votes
                        ? [
                            ...Object.keys(this.state.votes),
                            client.name,
                        ]
                        : [ client.name ],
                });

                // If all players are now ready, start the game and clear the "ready" votes.
                if (this.state.votes && Object.keys(this.state.votes).length >= this.clients.size - 1) {
                    setTimeout(() => this.startGame(), 3000);

                    return {
                        phase: GamePhase.Countdown,
                        votes: undefined,
                    }
                }

                // Otherwise, just record this player's readiness.
                return {
                    votes: {
                        [client.name]: ''
                    }
                };
            }
            else {
                if (client.name === this.state.setupPlayer) {
                    // Step back to card selection phase if the setup player is no longer ready.
                    return {
                        phase: GamePhase.CardSelection,
                        votes: undefined,
                    }
                }
                else {
                    // Remove this player's readiness, and tell everyone.
                    const newVotes = this.state.votes
                        ? { ...this.state.votes }
                        : {};
                    delete newVotes[client.name];

                    this.sendCommand(undefined, {
                        type: 'ready',
                        players: Object.keys(newVotes),
                    });

                    return {
                        votes: newVotes,
                    };
                }
            }
        }
        else if (this.state.phase === GamePhase.CardSelection && client.name === this.state.setupPlayer) {
            if (this.clients.size < minPlayers || this.state.cards.length !== this.clients.size + numExtraCards) {
                return;
            }

            // In card selection, the setup player indicates they are done selecting by sending ready.
            // So send (and mark) this player as ready, and advance to the readying phase.
            this.sendCommand(undefined, {
                type: 'get ready',
            });
            
            this.sendCommand(undefined, {
                type: 'ready',
                players: [ client.name ],
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
            const cardName = playerCards[client.name];
            if (cardName !== undefined) {
                this.sendCommand(client, {
                    type: 'assign',
                    card: cardName,
                });
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

        const results: Record<string, string> = {}
        let nextIndex = 0;

        for (const [_, client] of this.clients) {
            if (nextIndex >= indices.length) {
                break; // oops?
            }

            results[client.name] = this.state.cards[indices[nextIndex++]];
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
            const cardName = this.state.playerCards && this.state.playerCards[player];
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