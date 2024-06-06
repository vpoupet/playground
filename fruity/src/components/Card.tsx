import { Card as CardType } from "../classes/Card";
import { Fruit } from "./Fruit";

type CardProps = {
    card: CardType;
    hiddenFirst?: boolean;
    hiddenLast?: boolean;
};

export function Card({
    card,
    hiddenFirst = false,
    hiddenLast = false,
}: CardProps) {
    return (
        <div
            className={`flex flex-row bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm shadow-slate-500 rounded-lg`}
        >
            <div className="flex flex-col">
                <Fruit name={card.front.fruit1} hidden={hiddenFirst} />
                <Fruit name={card.front.fruit2} hidden={hiddenLast} />
            </div>
            <div className="flex flex-col">
                <Fruit name={card.back.fruit1} hidden={true} />
                <Fruit name={card.back.fruit2} hidden={true} />
            </div>
        </div>
    );
}
