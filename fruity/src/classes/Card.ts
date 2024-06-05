export type FruitName =
    | "banana"
    | "dragonfruit"
    | "kiwi"
    | "mango"
    | "pineapple"
    | "strawberry"
    | "watermelon";
import { shuffle, randomBit, randomInRange, randomElement } from "../utils";

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

// cards should already be shuffled
export function makeSequence(cards: Card[]): FruitName[] {
    type Action = "after" | "over" | "under";

    const sequence: FruitName[] = [];
    let canHideLast: boolean;

    const firstCard = cards.shift();
    if (firstCard === undefined) {
        throw new Error("No cards to create sequence from");
    }

    firstCard.randomize();
    firstCard.setPineappleStart();
    sequence.push(firstCard.front.fruit1);
    sequence.push(firstCard.front.fruit2);
    canHideLast = true;

    while (cards.length > 0) {
        const card = cards.shift()!;
        card.randomize();
        if (cards.length === 0) {
            // set pineapple at end (to end sequence)
            card.setPineappleStart();
            card.rotate();
        }

        const availableActions: Set<Action> = new Set([
            "after",
            "over",
            "under",
        ]);
        if (!canHideLast) {
            availableActions.delete("over");
        }
        if (card.front.fruit1 === "banana") {
            availableActions.delete("under");
        }
        if (card.front.fruit1 === "pineapple") {
            availableActions.delete("after");
            availableActions.delete("over");
        }
        if (card.front.fruit2 === "pineapple" && cards.length > 0) {
            // pineapple needs to be hidden by next card
            availableActions.delete("under");
        }
        if (sequence[sequence.length - 1] === "pineapple") {
            // last pineapple needs to be hidden
            availableActions.delete("after");
            availableActions.delete("under");
        }
        if (sequence[sequence.length - 1] === "banana") {
            // last banana cannot be hidden
            availableActions.delete("over");
        }

        switch (randomElement(availableActions)) {
            case "after":
                sequence.push(card.front.fruit1);
                sequence.push(card.front.fruit2);
                canHideLast = true;
                break;
            case "over":
                sequence.pop();
                sequence.push(card.front.fruit1);
                sequence.push(card.front.fruit2);
                canHideLast = true;
                break;
            case "under":
                sequence.push(card.front.fruit2);
                canHideLast = false;
                break;
            default:
                // no action available, retry card with different orientation
                cards.unshift(card);
        }
    }
    return sequence;
}

export function makeTargetSequences(): FruitName[][] {
    const cards = CARDS.slice();
    shuffle(cards);

    const sequences: FruitName[][] = [];
    while (cards.length > 0) {
        let nbCards = randomInRange(2, cards.length + 1);
        if (nbCards == cards.length - 1) {
            nbCards = cards.length;
        }
        sequences.push(makeSequence(cards.splice(0, nbCards)));
    }

    shuffle(sequences);
    return sequences;
}
