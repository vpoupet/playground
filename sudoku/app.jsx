let pressedKeys = new Set();

const SudokuGridHook = props => {
    const [cellValues, setCellValues] = React.useState(Array(81).fill(undefined));
    const [cellLocks, setCellLocks] = React.useState(81).fill(false);
    const [worker, setWorker] = React.useState(undefined);
    const cells = React.useRef([]);

    const isIdle = () => worker === undefined;
    const lock = () => setCellLocks(cellValues.map(v => v !== undefined));
    const unlock = () => setCellLocks(Array(81).fill(false));
    const solve = () => {
        if (isIdle()) {
            // start a new computation with a webworker
            let newWorker = new Worker('./solver.js');
            newWorker.postMessage({command: "solve", values: cellValues});

            newWorker.onmessage = event => {
                if (event.data !== undefined) {
                    setCellValues(event.data);
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
     * Solve the grid with current values
     * This method calls a Webworker in the background to run the search algorithm
     */
    const generate = () => {
        if (isIdle()) {
            // start a new computation with a webworker
            let newWorker = new Worker('./solver.js');
            newWorker.postMessage({command: "generate"});

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

    return (
        <div>
            <div className="grid" tabIndex="0">
                { cellValues.map((v, i) =>
                    <CellHook
                        key={i}
                        index={i}
                        value={v}
                        isLocked={cellLocks[i]}
                        setValue={v => changeCellValue(i, v)}
                        forwardRef={(input) => cells.current[i] = input}
                    />
                )}
            </div>
            <div id="buttons">
                <button onClick={generate}>{isIdle() ? "Generate" : "Stop"}</button>
                <button onClick={clear}>Clear</button>
                <button onClick={solve}>{isIdle() ? "Solve" : "Stop"}</button>
                <button onClick={lock}>Lock</button>
                <button onClick={unlock}>Unlock</button>
            </div>
        </div>
    );
};

class SudokuGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cellValues: Array(81).fill(undefined),
            cellLocks: Array(81).fill(false),
            worker: undefined,
        };
        this.cells = [];
    }

    isIdle() {
        return this.state.worker === undefined;
    }

    /**
     * Mark all cells that have a value as locked
     */
    lock() {
        this.setState({
            cellLocks: this.state.cellValues.map(v => v !== undefined),
        });
    }

    /**
     * Mark all cells as unlocked
     */
    unlock() {
        this.setState({
            cellLocks: Array(81).fill(false),
        });
    }

    /**
     * Solve the grid with current values
     * This method calls a Webworker in the background to run the search algorithm
     */
    solve() {
        if (this.isIdle()) {
            // start a new computation with a webworker
            let worker = new Worker('./solver.js');
            worker.postMessage({
                command: "solve",
                values: this.state.cellValues});

            worker.onmessage = event => {
                if (event.data !== undefined) {
                    this.setState({
                        cellValues: event.data,
                    });
                }
                this.state.worker.terminate();
                this.setState({ worker: undefined })
            };
            this.setState({ worker: worker });
        } else {
            // stop current computation
            this.state.worker.terminate();
            this.setState({ worker: undefined });
        }
    };

    /**
     * Solve the grid with current values
     * This method calls a Webworker in the background to run the search algorithm
     */
    generate() {
        if (this.isIdle()) {
            // start a new computation with a webworker
            let worker = new Worker('./solver.js');
            worker.postMessage({
                command: "generate"});

            worker.onmessage = event => {
                if (event.data !== undefined) {
                    this.setState({
                        cellValues: event.data,
                        cellLocks: event.data.map(v => v !== undefined),
                    });
                }
                this.state.worker.terminate();
                this.setState({worker: undefined})
            };

            this.setState({worker: worker});
        } else {
            // stop current computation
            this.state.worker.terminate();
            this.setState({ worker: undefined });
        }
    };

    /**
     * Unset the value for all unlocked cells
     */
    clear() {
        if (this.isIdle()) {
            this.setState({
                cellValues: this.state.cellValues.map((v, i) => this.state.cellLocks[i] ? v : undefined),
            });
        }
        for (let cell of this.cells) {
            cell.setState({
                small: Array(9).fill(false),
            });
        }
    };

    render() {
        return (
            <div>
            <div className="grid" tabIndex="0">
                { this.state.cellValues.map((v, i) =>
                    <Cell
                        key={i}
                        index={i}
                        value={v}
                        isLocked={this.state.cellLocks[i]}
                        setValue={v => this.setCellValue(i, v)}
                        ref={(input) => this.cells[i] = input}
                    />
                )}
            </div>
            <div id="buttons">
                <button onClick={() => this.generate()}>{this.isIdle() ? "Generate" : "Stop"}</button>
                <button onClick={() => this.clear()}>Clear</button>
                <button onClick={() => this.solve()}>{this.isIdle() ? "Solve" : "Stop"}</button>
                <button onClick={() => this.lock()}>Lock</button>
                <button onClick={() => this.unlock()}>Unlock</button>
            </div>
            </div>
        );
    }

    setCellValue(index, value) {
        if (!this.state.cellLocks[index]) {
            let values = [...this.state.cellValues];
            values[index] = value;
            this.setState({cellValues: values});
        }
    }
}

const CellHook = props => {
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

    const onPointerLeave = (event) => clearPointerTimer();

    let row = ~~(props.index / 9);
    let col = props.index % 9;
    let area = 3 * ~~(row / 3) + ~~(col / 3);
    let classes = ['cell', `R${row}`, `C${col}`, `A${area}`];
    if (props.isLocked) classes.push("locked");
    let smallNotes = [];
    if (props.value === undefined) {
        for (let i = 1; i <= 9; i++) {
            smallNotes.push(
                <div
                    className="small"
                    onMouseDown={e => onPointerDown(e, i)}
                    onMouseLeave={() => onPointerLeave()}
                    onMouseUp={e => onPointerUp(e, i)}
                    onPointerDown={e => onPointerDown(e, i)}
                    onPointerLeave={() => onPointerLeave()}
                    onPointerUp={e => onPointerUp(e, i)}
                    key={i}>
                    {small[i] ? i : ""}
                </div>);
        }
    }
    return (
        <div className={classes.join(' ')}>
            <div
                className="big"
                onTouchStart={() => {props.setValue(undefined)}}
                onMouseDown={() => {props.setValue(undefined)}}>
                { props.value }
            </div>
            { smallNotes }
        </div>
    );
};

class Cell extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            small: Array(9).fill(false),
        };
        this.pointerTimer = undefined;
        this.pointerValue = undefined;
    }

    render() {
        let row = ~~(this.props.index / 9);
        let col = this.props.index % 9;
        let area = 3 * ~~(row / 3) + ~~(col / 3);
        let classes = ['cell', `R${row}`, `C${col}`, `A${area}`];
        if (this.props.isLocked) classes.push("locked");
        let smallNotes = [];
        if (this.props.value === undefined) {
            for (let i = 1; i <= 9; i++) {
                smallNotes.push(
                    <div
                        className="small"
                        onMouseDown={e => this.onPointerDown(e, i)}
                        onMouseLeave={() => this.onPointerLeave()}
                        onMouseUp={e => this.onPointerUp(e, i)}
                        onPointerDown={e => this.onPointerDown(e, i)}
                        onPointerLeave={() => this.onPointerLeave()}
                        onPointerUp={e => this.onPointerUp(e, i)}
                        // onTouchStart={e => this.onPointerDown(e, i)}
                        // onTouchEnd={e => this.onPointerUp(e, i)}
                        key={i}>
                        {this.state.small[i] ? i : ""}
                    </div>);
            }
        }
        return (
            <div className={classes.join(' ')}>
                <div
                    className="big"
                    onTouchStart={() => {this.props.setValue(undefined)}}
                    onMouseDown={() => {this.props.setValue(undefined)}}>
                    { this.props.value }
                </div>
                { smallNotes }
            </div>
        );
    }

    clearPointerTimer() {
        clearTimeout(this.pointerTimer);
        this.pointerTimer = undefined;
    }

    onPointerDown(event, value) {
        if (!this.props.isLocked) {
            if (this.pointerTimer !== undefined) {
                this.clearPointerTimer();
            }
            this.pointerTimer = setTimeout(() => {
                console.log(this.pointerValue);
                this.props.setValue(this.pointerValue);
                this.clearPointerTimer();
            }, 250);
            this.pointerValue = value;
        }
    }

    onPointerUp(event, value) {
        if (this.pointerTimer !== undefined) {
            this.clearPointerTimer();
            let small = Array.from(this.state.small);
            small[value] = !small[value];
            this.setState({small: small});
        }
    }

    onPointerLeave(event) {
        this.clearPointerTimer();
    }
}

window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};

document.addEventListener("keydown", event => { pressedKeys.add(event.key); });
document.addEventListener("keyup", event => { pressedKeys.delete(event.key); });

ReactDOM.render(
    <SudokuGridHook />,
    document.getElementById('app')
);

