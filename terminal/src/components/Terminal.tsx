import { useCallback, useEffect, useState } from "react";
import "../terminal.scss";

export type TerminalColor = "green" | "orange" | "pink";

interface TerminalProps {
    lines: string[];
    color?: TerminalColor;
    classes?: string[];
}

export default function Terminal(props: TerminalProps) {
    const { lines, color = "green", classes = [] } = props;
    const [contentElement, setContentElement] = useState<HTMLPreElement | null>(
        null
    );
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

    const contentRef = useCallback((node: HTMLPreElement) => {
        // Monitor the scroll event on the box
        if (node) {
            setContentElement(node);
            node.addEventListener("scroll", () => {
                setIsScrolledToBottom(
                    node.scrollTop + 1.05 * node.clientHeight >=
                        node.scrollHeight
                );
            });
        }
    }, []);

    useEffect(() => {
        // Scroll to bottom when messages are added
        if (contentElement && isScrolledToBottom) {
            contentElement.scrollTop = contentElement.scrollHeight;
        }
    }, [contentElement, lines, isScrolledToBottom]);

    return (
        <div
            className={
                `terminal ${color} text-s relative aspect-[669/420] overflow-clip rounded-lg shadow-lg ` +
                classes.join(" ")
            }
        >
            <div className="background" />
            <pre
                ref={contentRef}
                className="absolute h-full w-full overflow-auto whitespace-pre-wrap p-[5%]"
            >
                {lines.map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </pre>
            <div className="scanlines" />
            <img src="./screen_bezel.png" alt="screen_bezel" className="bezel" />
        </div>
    );
}
