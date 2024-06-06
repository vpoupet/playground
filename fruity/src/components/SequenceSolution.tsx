import { CardsSequence } from "../classes/Card";
import { Card } from "./Card";

type TargetProps = {
    sequence: CardsSequence;
};

export function SequenceSolution({ sequence }: TargetProps) {
    return (
        <div className={`flex flex-col w-fit h-fit gap-1`}>
            {sequence.cards.map((card, index) => {
                const hiddenFirst = card.position === "under";
                const hiddenLast =
                    index + 1 < sequence.cards.length &&
                    sequence.cards[index + 1].position === "over";
                return (
                    <Card
                        card={card.card}
                        hiddenFirst={hiddenFirst}
                        hiddenLast={hiddenLast}
                        key={index}
                    />
                );
            })}
        </div>
    );
}
