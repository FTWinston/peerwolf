import React from 'react';

interface Props {
    className?: string;
    text?: string;
}

export const Label: React.FC<Props> = props => {
    const className = props.className
        ? 'label ' + props.className
        : 'label';

    const text = props.text
        ? <span className="label__text">{props.text}</span>
        : undefined;

    return (
        <label className={className}>
            {text}
            {props.children}
        </label>
    );
}