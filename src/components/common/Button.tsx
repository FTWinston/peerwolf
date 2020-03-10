import React from 'react';
import './Button.scss';

interface Props {
    className?: string;
    text: string;
    disabled?: boolean;
    onClick?: () => void;
}

export const Button: React.FC<Props> = props => {
    const classes = props.className
        ? `button ${props.className}`
        : 'button';

    return (
        <button
            className={classes}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.text}
        </button>
    )
}