import React from 'react';
import { PlayerStatus } from './PlayerList';

interface Props {
    player: string;
    status: PlayerStatus;
    isLocal: boolean;
}

export const PlayerListItem: React.FC<Props> = props => {
    let classes = `playerList__item  playerList__item--status${PlayerStatus[props.status]}`;
    if (props.isLocal) {
        classes += ' playerList__item--local';
    }

    return (
        <span className={classes}>
            {props.player}
        </span>
    );
}