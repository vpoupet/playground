export type FruitName =
    | "banana"
    | "dragonfruit"
    | "kiwi"
    | "mango"
    | "pineapple"
    | "strawberry"
    | "watermelon";
import { randomBit, randomInt, randomElement, shuffled, last } from "../utils";

type CardPosition = "after" | "over" | "under";

export class CardFace {
    fruit1: FruitName;
    fruit2: FruitName;

    constructor(fruit1: FruitName, fruit2: FruitName) {
        this.fruit1 = fruit1;
        this.fruit2 = fruit2;
    }
}

export class Card {
    front: CardFace;
    back: CardFace;

    constructor(face1: CardFace, face2: CardFace) {
        this.front = face1;
        this.back = face2;
    }

    copy(): Card {
        return new Card(
            new CardFace(this.front.fruit1, this.front.fruit2),
            new CardFace(this.back.fruit1, this.back.fruit2)
        );
    }

    flip(): void {
        [this.front, this.back] = [this.back, this.front];
    }

    rotate(): void {
        [this.front.fruit1, this.front.fruit2] = [
            this.front.fruit2,
            this.front.fruit1,
        ];
        [this.back.fruit1, this.back.fruit2] = [
            this.back.fruit2,
            this.back.fruit1,
        ];
    }

    randomize(): void {
        if (randomBit()) {
            this.flip();
        }
        if (randomBit()) {
            this.rotate();
        }
    }

    setPineappleStart(): void {
        if (this.front.fruit1 === "pineapple") return;
        if (this.front.fruit2 === "pineapple") {
            this.rotate();
            return;
        }
        if (this.back.fruit1 === "pineapple") {
            this.flip();
            return;
        }
        if (this.back.fruit2 === "pineapple") {
            this.flip();
            this.rotate();
            return;
        }
    }
}

export class PlacedCard {
    card: Card;
    position: CardPosition;

    constructor(card: Card, position: CardPosition) {
        this.card = card.copy();
        this.position = position;
    }
}

export const CARDS = [
    new Card(
        new CardFace("pineapple", "dragonfruit"),
        new CardFace("strawberry", "mango")
    ),
    new Card(
        new CardFace("pineapple", "mango"),
        new CardFace("watermelon", "dragonfruit")
    ),
    new Card(
        new CardFace("pineapple", "watermelon"),
        new CardFace("dragonfruit", "kiwi")
    ),
    new Card(
        new CardFace("pineapple", "watermelon"),
        new CardFace("pineapple", "strawberry")
    ),
    new Card(
        new CardFace("pineapple", "kiwi"),
        new CardFace("pineapple", "mango")
    ),
    new Card(
        new CardFace("pineapple", "kiwi"),
        new CardFace("banana", "banana")
    ),
    new Card(
        new CardFace("pineapple", "strawberry"),
        new CardFace("banana", "banana")
    ),
];

export class CardsSequence {
    cards: PlacedCard[];

    constructor(cards: PlacedCard[]) {
        this.cards = cards;
    }

    getFruitsList(): FruitName[] {
        const fruits: FruitName[] = [];
        for (const placedCard of this.cards) {
            switch (placedCard.position) {
                case "after":
                    fruits.push(placedCard.card.front.fruit1);
                    fruits.push(placedCard.card.front.fruit2);
                    break;
                case "over":
                    fruits.pop();
                    fruits.push(placedCard.card.front.fruit1);
                    fruits.push(placedCard.card.front.fruit2);
                    break;
                case "under":
                    fruits.push(placedCard.card.front.fruit2);
                    break;
            }
        }
        return fruits;
    }

    getLength(): number {
        let length = 0;
        for (const placedCard of this.cards) {
            switch (placedCard.position) {
                case "after":
                    length += 2;
                    break;
                case "over":
                    length += 1;
                    break;
                case "under":
                    length += 1;
                    break;
            }
        }
        return length;
    }
}

// cards should already be shuffled
export function makeSequence(cards: Card[]): CardsSequence {
    const placedCards: PlacedCard[] = [];

    const firstCard = cards.shift();
    if (firstCard === undefined) {
        throw new Error("No cards to create sequence from");
    }

    firstCard.randomize();
    firstCard.setPineappleStart();
    placedCards.push(new PlacedCard(firstCard, "after"));

    while (cards.length > 0) {
        const card = cards.shift()!;
        card.randomize();
        if (cards.length === 0) {
            // set pineapple at end (to end sequence)
            card.setPineappleStart();
            card.rotate();
        }

        const availablePositions: Set<CardPosition> = new Set([
            "after",
            "over",
            "under",
        ]);
        if (last(placedCards).position === "under") {
            availablePositions.delete("over");
        }
        if (card.front.fruit1 === "banana") {
            availablePositions.delete("under");
        }
        if (card.front.fruit1 === "pineapple") {
            availablePositions.delete("after");
            availablePositions.delete("over");
        }
        if (card.front.fruit2 === "pineapple" && cards.length > 0) {
            // pineapple needs to be hidden by next card
            availablePositions.delete("under");
        }
        if (last(placedCards).card.front.fruit2 === "pineapple") {
            // last pineapple needs to be hidden
            availablePositions.delete("after");
            availablePositions.delete("under");
        }
        if (last(placedCards).card.front.fruit1 === "banana") {
            // last banana cannot be hidden
            availablePositions.delete("over");
        }

        if (availablePositions.size === 0) {
            // No available position (last fruit was a pineapple and card's first fruit is a pineapple)
            // Flip the card, and if it's still a pineapple first, rotate it. The card can now be placed over the last pineapple
            card.flip();
            if (card.front.fruit1 === "pineapple") {
                card.rotate();
            }
            availablePositions.add("over");
        }

        const position = randomElement(availablePositions);
        placedCards.push(new PlacedCard(card, position));
    }
    return new CardsSequence(placedCards);
}

function makeTargetSequencesAux(
    cards: Card[],
    max_length: number = Infinity
): CardsSequence[] {
    if (cards.length === 0) {
        return [];
    }

    let nbCards = randomInt(2, cards.length);
    if (nbCards == cards.length - 1) {
        nbCards = cards.length;
    }
    const sequenceCards = cards.splice(0, nbCards);
    const sequence = makeSequence(sequenceCards.slice());
    if (sequence.getLength() <= max_length) {
        return [sequence, ...makeTargetSequences(cards, max_length)];
    } else {
        cards.unshift(...sequenceCards);
        return makeTargetSequences(cards, max_length);
    }
}

export function makeTargetSequences(
    cards: Card[],
    max_length: number = Infinity
): CardsSequence[] {
    cards = shuffled(cards);
    return shuffled(makeTargetSequencesAux(cards.slice(), max_length));
}
