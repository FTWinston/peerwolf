import React, { useState, useEffect } from 'react';
import { WolfClient } from '../functionality/WolfClient';
import { GamePhase } from '../functionality/ServerState';
import { Team, Card, cardDetails, errorCard } from '../functionality/Card';
import { ClientState } from '../functionality/ClientState';
import { GameSetup } from './GameSetup';
import { WaitForSetup } from './WaitForSetup';
import { Readying } from './Readying';
import { Countdown } from './Countdown';
import { Activity } from './Activity';
import { Discussion } from './Discussion';
import { Results } from './Results';
import { Message } from './Message';

interface Props {
    userName: string;
    remoteId: string;
    exit: () => void;
}

export interface GameState {
    phase: GamePhase;
    players: string[];
    setupPlayer: string;
    cards: Card[];
    localPlayerCard?: Card;
    playerCards: Record<string, Card>;
    votes: Record<string, string>;
    killedPlayers: string[];
    winners?: Team[];
}

export const Game: React.FC<Props> = props => {
    const [state, setState] = useState<GameState>(() => ({
        phase: GamePhase.Connecting,
        setupPlayer: '',
        players: [],
        cards: [],
        playerCards: {},
        votes: {},
        killedPlayers: [],
    }));

    const [client] = useState<WolfClient>(() => {
        const remoteId = props.remoteId.trim() ? props.remoteId.trim() : undefined;
        return new WolfClient(
            players => setState({ ...state, players}),
            clientState => setState(updateState(clientState, state.players)),
            props.userName,
            remoteId
        );
    });

    // Disconnect client on dismount
    useEffect(() => {
        return () => {
            client.disconnect();
        }
    }, []);

    switch (state.phase) {
        case GamePhase.Connecting:
            return <Message>Connecting...</Message>
    
        case GamePhase.CardSelection:
            if (state.setupPlayer === props.userName) {
                const setCards = (cards: Card[]) => client.sendCommand({
                    type: 'select cards',
                    cards: cards.map(card => card.name),
                });
                
                const confirm = () => client.sendCommand({ type: 'ready' });

                return (
                    <GameSetup
                        players={state.players}
                        localPlayer={props.userName}
                        cards={state.cards}
                        setCards={setCards}
                        setReady={confirm}
                    />
                );
            }
            
            return (
                <WaitForSetup
                    players={state.players}
                    localPlayer={props.userName}
                    setupPlayer={state.setupPlayer}
                    cards={state.cards}
                />
            );

        case GamePhase.Readying:
            const ready = () => client.sendCommand({ type: 'ready' });

            return (
                <Readying
                    players={state.players}
                    localPlayer={props.userName}
                    readyPlayers={Object.keys(state.votes)}
                    setReady={ready}
                    cards={state.cards}
                />
            )
        
        case GamePhase.Countdown:
            return <Countdown duration={5} />

        case GamePhase.Activity:
            return (
                <Activity
                    duration={30}
                />
            );

        case GamePhase.Discussion:
            const vote = (target: string) => client.sendCommand({
                type: 'vote',
                target,
            });

            return (
                <Discussion
                    players={state.players}
                    localPlayer={props.userName}
                    cards={state.cards}
                    votes={state.votes}
                    vote={vote}
                />
            );

        case GamePhase.Results:
            return (
                <Results
                    players={state.players}
                    localPlayer={props.userName}
                    killedPlayers={state.killedPlayers}
                    votes={state.votes}
                    winners={state.winners ?? []}
                    cards={state.cards}
                    playerCards={state.playerCards}
                />
            )
        default:
            throw new Error(`Invalid game phase: ${state.phase}`);
    }
}

function updateState(clientState: ClientState, players: string[]): GameState {
    let playerCards: Record<string, Card> = {};
    if (clientState.playerCards) {
        for (const player in clientState.playerCards) {
            playerCards[player] = getCard(clientState.playerCards[player]);
        }
    }

    return {
        phase: clientState.phase,
        setupPlayer: clientState.setupPlayer,
        cards: clientState.cards.map(getCard),
        players,
        localPlayerCard: clientState.localPlayerCard
            ? getCard(clientState.localPlayerCard)
            : undefined,
        playerCards,
        votes: clientState.votes ?? {},
        killedPlayers: clientState.killedPlayers ?? [],
        winners: clientState.winners,
    }
}

function getCard(card: string) {
    return cardDetails.get(card) ?? errorCard;
}