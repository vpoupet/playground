let pressedKeys = new Set();

const SudokuGrid = () => {
    // An array of 81 values in [1, 9] indicating the value in a cell, or undefined if the cell is empty
    const [cellValues, setCellValues] = React.useState(Array(81).fill(undefined));

    let annotations = Array(81);
    for (let i = 0; i < 81; i++) {
        annotations[i] = Array(9).fill(false);
    }
    // An array of 81 values containing for each cell an array of 9 booleans indicating which value annotations are
    // set
    const [cellAnnotations, setCellAnnotations] = React.useState(annotations);
    // An arrat of 81 booleans indicating whether each cell is locked (true) or not (false)
    const [cellLocks, setCellLocks] = React.useState(Array(81).fill(false));
    // The current active worker, or undefined if not currently solving
    const [worker, setWorker] = React.useState(undefined);

    /**
     * Return whether the app is idle (no worker currently solving) or not
     * @returns {boolean} true if there is an acitve worker, false otherwise
     */
    const isIdle = () => worker === undefined;

    /**
     * Lock all cells that currently have a value set
     */
    const lock = () => setCellLocks(cellValues.map(v => v !== undefined));

    /**
     * Unlock all cells
     */

    const unlock = () => setCellLocks(Array(81).fill(false));

    /**
     * Solve the grid with current values
     * This method calls a webworker in the background to run the search algorithm
     */
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
     * Generate a new Sudoku grid
     * The generated grid has a single solution and all given values are necessary
     */
    const generate = () => {
        if (isIdle()) {
            // start a new computation with a webworker
            let newWorker = new Worker('./solver.js');
            newWorker.postMessage({ command: "generate" });
            setWorker(newWorker);

            newWorker.onmessage = event => {
                if (event.data !== undefined) {
                    setCellValues(event.data);
                    setCellLocks(event.data.map(v => v !== undefined));
                }
                newWorker.terminate();
                setWorker(undefined);
            };
        } else {
            // stop current computation
            worker.terminate();
            setWorker(undefined);
        }
    };

    /**
     * Unset the value for all unlocked cells, and clear all annotations
     */
    const clear = () => {
        if (isIdle()) {
            setCellValues(cellValues.map((v, i) => cellLocks[i] ? v : undefined));
            let annotations = Array(81);
            for (let i = 0; i < 81; i++) {
                annotations[i] = Array(9).fill(false);
            }
            setCellAnnotations(annotations);
        }
    };

    /**
     * Change the value of a given cell
     * @param index {number} the index of the cell to change
     * @param value {number} the value of the cell (undefined to unset the cell)
     */
    const changeCellValue = (index, value) => {
        if (!cellLocks[index]) {
            let values = [...cellValues];
            values[index] = value;
            setCellValues(values);
        }
    };

    /**
     * Toggles one of the annotations of a cell
     * @param index {number} index of the cell
     * @param value {number} value of the annotation to toggle
     */
    const toggleAnnotation = (index, value) => {
        if (!cellLocks[index]) {
            let annotations = [...cellAnnotations];
            annotations[index][value] = !annotations[index][value];
            setCellAnnotations(annotations);
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
                annotations: cellAnnotations[i],
                isLocked: cellLocks[i],
                setValue: v => changeCellValue(i, v),
                toggleAnnotation: v => toggleAnnotation(i, v)
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
            props.toggleAnnotation(value);
        }
    };

    const onPointerLeave = event => clearPointerTimer();

    let row = ~~(props.index / 9);
    let col = props.index % 9;
    let area = 3 * ~~(row / 3) + ~~(col / 3);
    let classes = ['cell', `R${row}`, `C${col}`, `A${area}`];
    if (props.isLocked) classes.push("locked");
    let annotations = [];
    if (props.value === undefined) {
        for (let i = 1; i <= 9; i++) {
            annotations.push(React.createElement(
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
                props.annotations[i] ? i : ""
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
        annotations
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