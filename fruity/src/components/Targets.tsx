import { shuffle } from "../utils";
import { FruitName } from "../types";
import { Target } from "./Target";

type TargetsProps = {
    targetSequences: FruitName[][];
};

export const BG_COLORS = [
    "red",
    "orange",
    "yellow",
    // "lime",
    // "emerald",
    "cyan",
    "blue",
    "violet",
    "fuchsia",
    "rose",
];

export function Targets({ targetSequences }: TargetsProps) {
    const bg_colors = shuffle(BG_COLORS);

    return (
        <div className="flex flex-row items-center gap-3 w-fit">
            {targetSequences.map((targetSequence, i) => (
                <Target fruits={targetSequence} bgColor={bg_colors[i]} />
            ))}
        </div>
    );
}
