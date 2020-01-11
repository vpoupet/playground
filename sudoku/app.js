let pressedKeys = new Set();

const SudokuGrid = props => {
    const [cellValues, setCellValues] = React.useState(Array(81).fill(undefined));
    const [cellLocks, setCellLocks] = React.useState(Array(81).fill(false));
    const [cellAnnotations, setCellAnnotations] = React.useState(Array(81).fill(Array(9).fill(false)));
    const [worker, setWorker] = React.useState(undefined);
    const cells = React.useRef([]);

    const isIdle = () => worker === undefined;
    const lock = () => setCellLocks(cellValues.map(v => v !== undefined));
    const unlock = () => setCellLocks(Array(81).fill(false));
    const solve = () => {
        if (isIdle()) {
            // start a new computation with a webworker
            let newWorker = new Worker('solver.js');
            newWorker.postMessage({ command: "solve", values: cellValues });

            newWorker.onmessage = event => {
                if (event.data !== undefined) {
                    setCellValues(event.data);
                }
                newWorker.terminate();
                setWorker(undefined);
            };
            setWorker(newWorker);
        } else {
            // stop current computation
            worker.terminate();
            setWorker(undefined);
        }
    };

    /**
     * Solve the grid with current values
     * This method calls a Webworker in the background to run the search algorithm
     */
    const generate = () => {
        if (isIdle()) {
            // start a new computation with a webworker
            let newWorker = new Worker('./solver.js');
            newWorker.postMessage({ command: "generate" });

            newWorker.onmessage = event => {
                if (event.data !== undefined) {
                    setCellValues(event.data);
                    setCellLocks(event.data.map(v => v !== undefined));
                }
                worker.terminate();
                setWorker(undefined);
            };
            setWorker(newWorker);
        } else {
            // stop current computation
            worker.terminate();
            setWorker(undefined);
        }
    };

    /**
     * Unset the value for all unlocked cells
     */
    const clear = () => {
        if (isIdle()) {
            setCellValues(cellValues.map((v, i) => cellLocks[i] ? v : undefined));
        }
        for (let cell of cells) {
            cell.setState({ small: Array(9).fill(false) });
        }
    };

    const changeCellValue = (index, value) => {
        if (!cellLocks[index]) {
            let values = [...cellValues];
            values[index] = value;
            setCellValues(values);
        }
    };

    return React.createElement(
        'div',
        null,
        React.createElement(
            'div',
            { className: 'grid', tabIndex: '0' },
            cellValues.map((v, i) => React.createElement(Cell, {
                key: i,
                index: i,
                value: v,
                isLocked: cellLocks[i],
                setValue: v => changeCellValue(i, v),
                forwardRef: input => cells.current[i] = input
            }))
        ),
        React.createElement(
            'div',
            { id: 'buttons' },
            React.createElement(
                'button',
                { onClick: generate },
                isIdle() ? "Generate" : "Stop"
            ),
            React.createElement(
                'button',
                { onClick: clear },
                'Clear'
            ),
            React.createElement(
                'button',
                { onClick: solve },
                isIdle() ? "Solve" : "Stop"
            ),
            React.createElement(
                'button',
                { onClick: lock },
                'Lock'
            ),
            React.createElement(
                'button',
                { onClick: unlock },
                'Unlock'
            )
        )
    );
};

const Cell = props => {
    const [small, setSmall] = React.useState(Array(9).fill(false));

    let pointerTimer = undefined;
    let pointerValue = undefined;

    const clearPointerTimer = () => {
        clearTimeout(pointerTimer);
        pointerTimer = undefined;
    };

    const onPointerDown = (event, value) => {
        if (!props.isLocked) {
            if (pointerTimer !== undefined) {
                clearPointerTimer();
            }
            pointerTimer = setTimeout(() => {
                console.log(pointerValue);
                props.setValue(pointerValue);
                clearPointerTimer();
            }, 250);
            pointerValue = value;
        }
    };

    const onPointerUp = (event, value) => {
        if (pointerTimer !== undefined) {
            clearPointerTimer();
            let newSmall = Array.from(small);
            newSmall[value] = !newSmall[value];
            setSmall(newSmall);
        }
    };

    const onPointerLeave = event => clearPointerTimer();

    let row = ~~(props.index / 9);
    let col = props.index % 9;
    let area = 3 * ~~(row / 3) + ~~(col / 3);
    let classes = ['cell', `R${row}`, `C${col}`, `A${area}`];
    if (props.isLocked) classes.push("locked");
    let smallNotes = [];
    if (props.value === undefined) {
        for (let i = 1; i <= 9; i++) {
            smallNotes.push(React.createElement(
                'div',
                {
                    className: 'small',
                    onMouseDown: e => onPointerDown(e, i),
                    onMouseLeave: () => onPointerLeave(),
                    onMouseUp: e => onPointerUp(e, i),
                    onPointerDown: e => onPointerDown(e, i),
                    onPointerLeave: () => onPointerLeave(),
                    onPointerUp: e => onPointerUp(e, i),
                    key: i },
                small[i] ? i : ""
            ));
        }
    }
    return React.createElement(
        'div',
        { className: classes.join(' ') },
        React.createElement(
            'div',
            {
                className: 'big',
                onTouchStart: () => {
                    props.setValue(undefined);
                },
                onMouseDown: () => {
                    props.setValue(undefined);
                } },
            props.value
        ),
        smallNotes
    );
};

window.oncontextmenu = function (event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};

document.addEventListener("keydown", event => {
    pressedKeys.add(event.key);
});
document.addEventListener("keyup", event => {
    pressedKeys.delete(event.key);
});

ReactDOM.render(React.createElement(SudokuGrid, null), document.getElementById('app'));

//# sourceMappingURL=app.js.map