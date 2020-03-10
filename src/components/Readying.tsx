import React, { useState, useEffect } from 'react';
import { Card } from '../functionality/Card';
import './Game.scss';

interface Props {
    cards: Card[];
    players: string[];
    readyPlayers: string[];
    localPlayer: string;
    setReady: () => void;
}

export const Readying: React.FC<Props> = props => {
    return (
        <div className="game game--waitsetup">
            blah
        </div>
    )
}