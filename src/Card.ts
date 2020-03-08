export type Team = 'monsters' | 'humans' | 'tanner';

export interface Card {
    name: string;
    description: string;
    team: Team;
    limit?: number;
    winsWith?: Team;
}

const allCards: Card[] = [
    {
        name: 'Villager',
        description: `Just a simple villager.`,
        team: 'humans',
    },
    {
        name: 'Werewolf',
        description: `Werewolves see each other. If there's only one werewolf, it can look at one of the extra cards.`,
        team: 'monsters',
    },
    {
        name: 'Seer',
        description: `The seer looks at one other player's card, or two of the extra cards.`,
        team: 'humans',
    },
    {
        name: 'Robber',
        description: `The robber swaps their card with another player, then looks at their new card.`,
        team: 'humans',
    },
    {
        name: 'Troublemaker',
        description: `The troublemaker swaps two other players' cards, without looking at them.`,
        team: 'humans',
    },
    {
        name: 'Minion',
        description: `The minion is a human, but wins with the werewolfs. Werewolfs see who the minion is.`,
        team: 'humans',
        winsWith: 'monsters',
        limit: 1,
    },
    {
        name: 'Tanner',
        description: `The troublemaker swaps two other players' cards, without looking at them.`,
        team: 'tanner',
        limit: 1,
    },
];

export const cardDetails: ReadonlyMap<string, Card> = new Map(allCards.map(card => [card.name, card]));