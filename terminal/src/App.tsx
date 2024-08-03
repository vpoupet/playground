import { useState } from "react";
import Terminal from "./components/Terminal";
import { bootSequence } from "./bootSequence.ts";
import ColorSelector from "./components/ColorSelector.tsx";

export default function App() {
    const bootLines = bootSequence.split("\n");
    const [lines, setLines] = useState<string[]>([]);
    const [color, setColor] = useState<"green" | "orange" | "pink">("green");
    const [isBooting, setIsBooting] = useState(false);

    function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function addLinesWithDelay(index: number = 0) {
        if (index < bootLines.length) {
            setLines((prevLines) => [...prevLines, bootLines[index]]);
            const delay = Math.random() * 200;
            await sleep(delay);
            addLinesWithDelay(index + 1);
        } else {
            setLines((prevLines) => [...prevLines, "Boot sequence complete."]);
            setIsBooting(false);
        }
    }

    function startBootSequence() {
        if (!isBooting) {
            setIsBooting(true);
            setLines([]);
            addLinesWithDelay(0);
        }
    }

    return (
        <div className="w-screen h-screen bg-gradient-to-br from-gray-500 to-gray-700">
            <div className="flex flex-col align-middle gap-1 items-center p-4">
                <Terminal lines={lines} color={color} classes={["w-[800px]"]} />
                <div className="flex gap-8 items-center">
                    <button
                        onClick={startBootSequence}
                        type="button"
                        className={
                            isBooting
                                ? "bg-white text-gray-300 font-semibold py-2 px-4 border border-gray-200 rounded"
                                : "bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
                        }
                    >
                        Boot
                    </button>
                    <div className="flex gap-1">
                        <ColorSelector color="green" setColor={setColor} />
                        <ColorSelector color="orange" setColor={setColor} />
                        <ColorSelector color="pink" setColor={setColor} />
                    </div>
                </div>
            </div>
        </div>
    );
}
