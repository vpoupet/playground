import { TerminalColor } from "./Terminal";

interface ColorSelectorProps {
    color: TerminalColor;
    setColor: (color: TerminalColor) => void;
}

export default function ColorSelector(props: ColorSelectorProps) {
    const { color, setColor } = props;
    return (
        <button
            className={`rounded-full terminal-color-selector ${color} h-8 w-8 border-2 border-solid border-black`}
            onClick={() => setColor(color)}
        ></button>
    );
}
