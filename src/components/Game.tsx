import React from 'react';

interface Props {
    userName: string;
    remoteId: string;
    exit: () => void;
}

export const Game: React.FC<Props> = props => {
    return (
        <div className="game">
            <p>User name is {props.userName}</p>

            <p>Remote ID is {props.remoteId}</p>
        </div>
    )
}