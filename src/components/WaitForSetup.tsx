import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../functionality/Card';
import { CardDisplay } from './common/CardDisplay';
import { PlayerList, PlayerStatus } from './common/PlayerList';

interface Props {
    cards: Card[];
    players: string[];
    serverId: string;
    setupPlayer: string;
    localPlayer: string;
}

export const WaitForSetup: React.FC<Props> = props => {
    const players = useMemo(
        () => {
            return props.players.reduce(
                (a, b) => { a[b] = PlayerStatus.None; return a; },
                {} as Record<string, PlayerStatus>
            );
        },
        [props.players]
    )

    return (
        <div className="gameSetup">
            <h2 className="gameSetup__heading">Game setup</h2>

            <div className="gameSetup__connection">
                Players should connect to: {props.serverId}
            </div>

            <div className="gameSetup__cards">
                {props.cards.map((card, index) => <CardDisplay key={index} card={card} />)}
            </div>

            <div className="gameSetup__quantities">
                {props.setupPlayer} is choosing the cards.
            </div>

            <PlayerList
                className="gameSetup__players"
                players={players}
                localPlayer={props.localPlayer}
                showPrefix={true}
            />
        </div>
    );
}