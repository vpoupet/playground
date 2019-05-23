let pressedKeys = new Set();

class SudokuGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cellValues: Array(81).fill(undefined),
            cellLocks: Array(81).fill(false),
            shouldClearSmall: false,
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

class Cell extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            small: Array(9).fill(false),
        };
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
                    <div className="small" onClick={() => this.onClickSmall(i)} key={i}>
                        {this.state.small[i] ? i : ""}
                    </div>);
            }
        }
        return (
            <div className={classes.join(' ')}>
                <div className="big" onClick={() => this.props.setValue(undefined)}>{ this.props.value }</div>
                { smallNotes }
            </div>
        );
    }

    onClickSmall(value) {
        if (!this.props.isLocked) {
            if (pressedKeys.has("Shift")) {
                this.props.setValue(value);
            } else {
                let small = Array.from(this.state.small);
                small[value] = !small[value];
                this.setState({small: small});
            }
        }
    }
}

document.addEventListener("keydown", event => { pressedKeys.add(event.key); });
document.addEventListener("keyup", event => { pressedKeys.delete(event.key); });

ReactDOM.render(
    <SudokuGrid />,
    document.getElementById('app')
);

