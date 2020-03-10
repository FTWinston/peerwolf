import React, { useMemo } from 'react';
import { Card, errorCard } from '../../functionality/Card';
import './CardDisplay.scss';

interface Props {
    card?: Card;
    className?: string;
}

export const CardDisplay: React.FC<Props> = props => {
    const classes = useMemo(
        () => determineClasses(props.card, props.className),
        [props.card, props.className]
    );
    
    const name = props.card?.name ?? 'Unknown';

    return (
        <div className={classes}>
            <div className="card__name">{name}</div>
        </div>
    )
}

function determineClasses(card?: Card, className?: string) {
    if (!card) {
        return `card card--unknown ${className}`.trim();
    }

    if (card === errorCard) {
        return `card card--error ${className}`.trim();
    }

    const name = card.name.replace(' ', '');
    const team = card.team.replace(' ', '');
    return `card card--${team} card--${name} ${className}`.trim();
}