import React, { useState, useEffect } from 'react';
import { Card } from '../functionality/Card';
import './Game.scss';

interface Props {
    cards: Card[];
    setCards: (cards: Card[]) => void;
    confirm: () => void;
}

export const GameSetup: React.FC<Props> = props => {
    return (
        <div className="game game--setup">
            blah
        </div>
    )
}