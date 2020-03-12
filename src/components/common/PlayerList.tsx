import React from 'react';
import './PlayerList.scss';
import { PlayerListItem } from './PlayerListItem';

export enum PlayerStatus {
    None,
    Ready,
    NotReady,
}

interface Props {
    players: Record<string, PlayerStatus>;
    localPlayer: string;
    className?: string;
}

export const PlayerList: React.FC<Props> = props => {
    const classes = props.className
        ? `playerList ${props.className}`
        : `playerList`;

    const items = Object.keys(props.players)
        .map(player => (
            <PlayerListItem
                key={player}
                player={player}
                status={props.players[player]}
                isLocal={player === props.localPlayer}
            />
        ));

    return (
        <div className={classes}>
            {items}
        </div>
    );
}