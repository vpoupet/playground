import { CardsSequence } from "../classes/Card";
import { SequenceSolution } from "./SequenceSolution";
import { Target } from "./Target";

type TargetsProps = {
    targetSequences: CardsSequence[];
    showSolutions: boolean;
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
    // "fuchsia",
    // "rose",
];

export function Targets({ targetSequences, showSolutions }: TargetsProps) {
    // const bg_colors = shuffled(BG_COLORS);

    return (
        <div className="flex flex-row items-center gap-3 w-fit">
            {targetSequences.map((targetSequence, i) => <>
                <Target
                    fruits={targetSequence.getFruitsList()}
                    bgColor={BG_COLORS[i % BG_COLORS.length]}
                    key={i}
                />
                {showSolutions ? <SequenceSolution sequence={targetSequence} key={i} /> : null}
            </>)}
        </div>
    );
}
