import { useEffect, useState } from "react";
import "./App.css";
import { CARDS, makeTargetSequences } from "./classes/Card";
import { Targets } from "./components/Targets";

function App() {
    const [nbSets, setNbSets] = useState(1);
    const [targetSequences, setTargetSequences] = useState(generateSequences());

    useEffect(() => {
        refreshSequences();
    }, [nbSets]);

    function generateSequences() {
        const cards = [];
        for (let i = 0; i < nbSets; i++) {
            cards.push(...CARDS);
        }
        return makeTargetSequences(cards, 8);
    }

    function refreshSequences() {
        setTargetSequences(generateSequences());
    }

    function updateNbSets(event: React.ChangeEvent<HTMLSelectElement>) {
        setNbSets(parseInt(event.target.value));
    }

    return (
        <div className="flex flex-col gap-4 items-center">
            <div className="font-kavoon text-6xl bg-gradient-to-r from-red-500 via-amber-500 to-orange-500 inline-block text-transparent bg-clip-text">
                Fruity ASAP!
            </div>
            <div className="flex gap-4">
                <button
                    className="bg-amber-500 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded w-fit shadow-slate-600 shadow-sm"
                    onClick={refreshSequences}
                >
                    Reroll
                </button>
                <select onChange={updateNbSets} className="rounded">
                    <option value="1">1 set</option>
                    <option value="2">2 sets</option>
                    <option value="3">3 sets</option>
                    <option value="4">4 sets</option>
                </select>
            </div>
            <div className="w-full flex flex-col items-center">
                <Targets targetSequences={targetSequences} />
            </div>
        </div>
    );
}

export default App;
