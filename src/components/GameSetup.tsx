import React from 'react';
import { Card } from '../functionality/Card';
import { CardQuantity } from './common/CardQuantity';
import './Game.scss';

interface Props {
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
                card={card}
                quantity={quantity}
                setQuantity={newAmount => props.setCards(adjustAmount(cards, card, newAmount))}
            />
        );
    }

    return (
        <div className="game game--setup">
            blah
        </div>
    )
}

function arrayToMap(cards: Card[]): Map<Card, number> {
    const results = new Map<Card, number>();

    for (const card of cards) {
        const existing = results.get(card);
        results.set(card, existing === undefined ? 1 : existing + 1);
    }

    return results;
}

function mapToArray(cards: Map<Card, number>): Card[] {
    const results: Card[] = [];

    for (const [card, quantity] of cards) {
        for (let i=0; i<quantity; i++) {
            results.push(card);
        }
    }

    return results;
}

function adjustAmount(cards: Map<Card, number>, card: Card, quantity: number) {
    cards.set(card, quantity);
    return mapToArray(cards);
}