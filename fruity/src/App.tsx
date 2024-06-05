import { useState } from "react";
import "./App.css";
import { makeTargetSequences } from "./classes/Card";
import { Targets } from "./components/Targets";

function App() {
    const [targetSequences, setTargetSequences] = useState(
        makeTargetSequences()
    );

    function refresh() {
        setTargetSequences(makeTargetSequences());
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="font-kavoon text-6xl">Fruity ASAP!</div>
            <button onClick={refresh}>Refresh</button>
            <div className="w-full flex flex-col items-center">
                <Targets targetSequences={targetSequences} />
            </div>
        </div>
    );
}

export default App;
