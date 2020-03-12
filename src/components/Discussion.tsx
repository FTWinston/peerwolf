import React, { useState, useEffect } from 'react';
import { Card } from '../functionality/Card';

interface Props {
    cards: Card[];
    players: string[];
    localPlayer: string;
    votes: Record<string, string>;
    vote: (target: string) => void;
}

export const Discussion: React.FC<Props> = props => {
    return (
        <div className="game game--discussion">
            blah
        </div>
    )
}