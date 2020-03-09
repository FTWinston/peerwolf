import React from 'react';
import { Label } from './common/Label';
import './MainMenu.scss';

interface Props {
    userName: string;
    remoteId: string;
    setUserName: (val: string) => void;
    setRemoteId: (val: string) => void;
    startHost: () => void;
    startRemote: () => void;
}

export const MainMenu: React.FC<Props> = props => {
    return (
        <form className="mainMenu" onSubmit={e => e.preventDefault()}>
            <h1 className="mainMenu__row mainMenu__title">Peerwolf</h1>
            
            <Label className="mainMenu__row" text="Your name">
                <input
                    type="text"
                    value={props.userName}
                    onChange={e => props.setUserName(e.target.value)}
                />
            </Label>

            <Label className="mainMenu__row" text="Remote ID">
                <input
                    type="text"
                    value={props.remoteId}
                    placeholder="Leave blank to host"
                    onChange={e => props.setRemoteId(e.target.value)}
                />
            </Label>

            <div className="mainMenu__row">
                <input
                    className="mainMenu__button"
                    type="submit"
                    value="Join"
                    disabled={!props.userName.trim() || !props.remoteId.trim()}
                    onClick={props.startRemote}
                />

                <input
                    className="mainMenu__button"
                    type="submit"
                    value="Host"
                    disabled={!props.userName.trim() || !!props.remoteId.trim()}
                    onClick={props.startHost}
                />
            </div>
        </form>
    )
}