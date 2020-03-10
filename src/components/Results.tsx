import React, { useState, useEffect } from 'react';
import { Card, Team } from '../functionality/Card';
import './Game.scss';

interface Props {
    cards: Card[];
    players: string[];
    localPlayer: string;
    playerCards: Record<string, Card>;
    votes: Record<string, string>;
    killedPlayers: string[];
    winners: Team[];
}

export const Results: React.FC<Props> = props => {
    return (
        <div className="game game--results">
            blah
        </div>
    )
}