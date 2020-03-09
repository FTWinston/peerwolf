import React, { useState, useEffect } from 'react';
import { WolfClient } from '../functionality/WolfClient';
import { GamePhase } from '../functionality/ServerState';
import { Team, Card, cardDetails, errorCard } from '../functionality/Card';
import { ClientState } from '../functionality/ClientState';
import './Game.scss';
import { GameSetup } from './GameSetup';
import { WaitForSetup } from './WaitForSetup';

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

    if (state.phase === GamePhase.Connecting) {
        return <div className="game game--connecting">Connecting...</div>
    }
    else if (state.phase === GamePhase.CardSelection) {
        if (state.setupPlayer === props.userName) {
            const setCards = (cards: Card[]) => client.sendCommand({
                type: 'select cards',
                cards: cards.map(card => card.name),
            });
            
            const confirm = () => client.sendCommand({ type: 'ready' });

            return (
                <GameSetup
                    cards={state.cards}
                    setCards={setCards}
                    confirm={confirm}
                />
            );
        }
        else {
            return (
                <WaitForSetup
                    cards={state.cards}
                    setupPlayer={state.setupPlayer}
                />
            );
        }
    }

    return (
        <div className="game">
            <p>User name is {props.userName}</p>

            <p>Remote ID is {props.remoteId}</p>
        </div>
    )
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