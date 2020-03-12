import React, { useMemo } from 'react';
import { Card, cardDetails } from '../functionality/Card';
import { CardQuantity } from './common/CardQuantity';
import './GameSetup.scss';
import { PlayerList, PlayerStatus } from './common/PlayerList';
import { numExtraCards } from '../functionality/ServerState';
import { Button } from './common/Button';

interface Props {
    players: string[];
    localPlayer: string;
    cards: Card[];
    setCards: (cards: Card[]) => void;
    setReady: () => void;
}

export const GameSetup: React.FC<Props> = props => {
    const cards = arrayToMap(props.cards);
    const cardQuantities: JSX.Element[] = [];

    for (const [card, quantity] of cards) {
        cardQuantities.push(
            <CardQuantity
                key={card.name}
                card={card}
                quantity={quantity}
                setQuantity={newAmount => props.setCards(adjustAmount(cards, card, newAmount))}
            />
        );
    }

    const players = useMemo(
        () => {
            return props.players.reduce(
                (a, b) => { a[b] = PlayerStatus.None; return a; },
                {} as Record<string, PlayerStatus>
            );
        },
        [props.players]
    )

    const targetNumCards = props.players.length + numExtraCards;

    const quantities = props.cards.length < targetNumCards
        ? (
            <div className="gameSetup__quantities">
                <p>You have {props.players.length} players, so need <span className="gameSetup__quantity gameSetup__quantity--invalid">{targetNumCards}</span> cards.</p>
                <p>Select <span className="gameSetup__quantity">{targetNumCards - props.cards.length} more</span> cards.</p>
            </div>
        )
        : props.cards.length > targetNumCards
            ? (
                <div className="gameSetup__quantities">
                    <p>You have {props.players.length} players, so need <span className="gameSetup__quantity gameSetup__quantity--invalid">{targetNumCards}</span> cards.</p>
                    <p>Select <span className="gameSetup__quantity">{props.cards.length - targetNumCards} fewer</span> cards.</p>
                </div>
            )
            : (
                <div className="gameSetup__quantities">
                    <p>You have {props.players.length} players, so need <span className="gameSetup__quantity gameSetup__quantity--valid">{targetNumCards}</span> cards.</p>
                </div>
            );


    return (
        <div className="gameSetup">
            <h2 className="gameSetup__heading">Game setup</h2>

            <div className="gameSetup__quantities">
                {cardQuantities}
            </div>

            <PlayerList
                className="gameSetup__players"
                players={players}
                localPlayer={props.localPlayer}
            />

            {quantities}

            <div className="gameSetup__actions">
                <Button
                    disabled={props.cards.length !== targetNumCards}
                    text="Ready"
                    onClick={props.setReady}
                />
            </div>
        </div>
    )
}

function arrayToMap(cards: Card[]): Map<Card, number> {
    const results = new Map<Card, number>();

    for (const [_, card] of cardDetails) {
        results.set(card, 0);
    }

    for (const card of cards) {
        const existing = results.get(card);
        results.set(card, existing === undefined ? 1 : existing + 1);
    }

    return results;
}

function mapToArray(cards: Map<Card, number>): Card[] {
    const results: Card[] = [];

    for (const [card, quantity] of cards) {
        for (let i = 0; i < quantity; i++) {
            results.push(card);
        }
    }

    return results;
}

function adjustAmount(cards: Map<Card, number>, card: Card, quantity: number) {
    cards.set(card, quantity);
    return mapToArray(cards);
}