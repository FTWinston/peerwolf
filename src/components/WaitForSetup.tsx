import React, { useState, useEffect } from 'react';
import { Card } from '../functionality/Card';
import './Game.scss';

interface Props {
    cards: Card[];
    setupPlayer: string;
}

export const WaitForSetup: React.FC<Props> = props => {
    return (
        <div className="game game--waitsetup">
            blah
        </div>
    )
}