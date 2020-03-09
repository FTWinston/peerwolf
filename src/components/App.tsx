import React, { useState } from 'react';
import { MainMenu } from './MainMenu';
import { Game } from './Game';

export const App = () => {
    const [inGame, setInGame] = useState(false);
    const [userName, setUserName] = useState('');
    const [remoteId, setRemoteId] = useState('');

    if (inGame) {
        const exit = () => {
            setRemoteId('');
            setInGame(false);
        };

        return (
            <Game
                userName={userName}
                remoteId={remoteId}
                exit={exit}
            />
        );
    }

    const startHost = () => {
        if (!userName) {
            return;
        }

        setRemoteId('');
        setInGame(true);
    }

    const startRemote = () => {
        if (!userName || !remoteId) {
            return;
        }

        setInGame(true);
    }

    return (
        <MainMenu
            userName={userName}
            setUserName={setUserName}
            remoteId={remoteId}
            setRemoteId={setRemoteId}
            startHost={startHost}
            startRemote={startRemote}
        />        
    );
}
