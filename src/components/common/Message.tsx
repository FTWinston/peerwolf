import React from 'react';
import './Message.scss';

interface Props {
    error?: boolean
}

export const Message: React.FC<Props> = props => {
    const classes = props.error
        ? 'message message--error'
        : 'message';

    return (
        <div className={classes}>
            {props.children}
        </div>
    )
}