import React from 'react';
import { Card } from '../../functionality/Card';
import { CardDisplay } from './CardDisplay';
import './CardQuantity.scss';
import { Button } from './Button';

interface Props {
    card: Card;
    quantity: number;
    setQuantity: (quantity: number) => void;
}

export const CardQuantity: React.FC<Props> = props => {
    const classes = props.quantity === 0
        ? 'cardQuantity cardQuantity--zero'
        : 'cardQuantity';

    const increment = () => props.setQuantity(props.quantity + 1);
    const decrement = () => props.setQuantity(props.quantity - 1);

    return (
        <div className={classes}>
            <CardDisplay card={props.card} className="cardQuantity__card" />
            <Button
                className="cardQuantity__button cardQuantity__button--increment"
                disabled={props.card.limit !== undefined && props.quantity >= props.card.limit}
                onClick={increment}
                text="+"
            />

            <div className="cardQuantity__quantity">{props.quantity}</div>

            <Button
                className="cardQuantity__button cardQuantity__button--decrement"
                disabled={props.quantity <= 0}
                onClick={decrement}
                text="-"
            />
        </div>
    )
}