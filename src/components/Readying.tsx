import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../functionality/Card';
import { PlayerList, PlayerStatus } from './common/PlayerList';
import { Button } from './common/Button';
import { CardDisplay } from './common/CardDisplay';

interface Props {
    cards: Card[];
    players: string[];
    readyPlayers: string[];
    localPlayer: string;
    setupPlayer: string;
    setReady: () => void;
}

export const Readying: React.FC<Props> = props => {
    const players = useMemo(
        () => {
            return props.players.reduce(
                (a, b) => { a[b] = props.readyPlayers.indexOf(b) !== -1 ? PlayerStatus.Ready : PlayerStatus.NotReady; return a; },
                {} as Record<string, PlayerStatus>
            );
        },
        [props.players]
    )

    return (
        <div className="gameSetup">
            <h2 className="gameSetup__heading">Ready to start?</h2>

            <div className="gameSetup__cards">
                {props.cards.map((card, index) => <CardDisplay key={index} card={card} />)}
            </div>

            <div className="gameSetup__quantities">
                {props.setupPlayer} has chosen the above cards. Waiting for all players to say they're ready to start.
            </div>


            <PlayerList
                className="gameSetup__players"
                players={players}
                localPlayer={props.localPlayer}
                showPrefix={true}
            />
            <div className="gameSetup__actions">
                <Button
                    disabled={props.readyPlayers.indexOf(props.localPlayer) !== -1}
                    text="Ready"
                    onClick={props.setReady}
                />
            </div>
        </div>
    );
}