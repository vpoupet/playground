class Sudoku extends React.Component {
    constructor(props) {
        super(props);
        let cells = [];
        for (let i = 0; i < 81; i++) {
            cells.push({
                value: undefined,
            });
        }

        this.state = {
            cells: cells,
            focusIndex: undefined,
            worker: undefined,
        }
    }

    isIdle() {
        return this.state.worker === undefined;
    }

    /**
     * Mark all cells that have a value as locked
     */
    lock() {
        for (let cell of this.state.cells) {
            cell.isLocked = cell.value !== undefined;
        }
        this.forceUpdate();
    }

    /**
     * Mark all cells as unlocked
     */
    unlock() {
        for (let cell of this.state.cells) {
            cell.isLocked = false;
        }
        this.forceUpdate();
    }

    /**
     * Solve the grid with current values
     * This method calls a Webworker in the background to run the search algorithm
     */
    solve() {
        if (this.state.worker !== undefined) {
            // stop current computation
            this.state.worker.terminate();
            this.setState({ worker: undefined });
        } else {
            // start a new computation with a webworker
            let worker = new Worker('./solver.js');
            worker.postMessage({
                command: "solve",
                values: this.state.cells.map(c => c.value)});

            worker.onmessage = event => {
                if (event.data !== undefined) {
                    event.data.map((v, i) => this.state.cells[i].value = v);
                }
                this.state.worker.terminate();
                this.setState({ worker: undefined })
            };
            this.setState({ worker: worker });
        }
    };

    /**
     * Solve the grid with current values
     * This method calls a Webworker in the background to run the search algorithm
     */
    generate() {
        if (this.state.worker !== undefined) {
            // stop current computation
            this.state.worker.terminate();
            this.setState({ worker: undefined });
        } else {
            // start a new computation with a webworker
            let worker = new Worker('./solver.js');
            worker.postMessage({command: "generate"});

            worker.onmessage = event => {
                if (event.data !== undefined) {
                    event.data.map((v, i) => this.state.cells[i].value = v);
                }
                for (let cell of this.state.cells) {
                    cell.isLocked = cell.value !== undefined;
                }
                this.state.worker.terminate();
                this.setState({ worker: undefined })
            };
            this.setState({ worker: worker });
        }
    };

    /**
     * Unset the value for all unlocked cells
     */
    clear() {
        if (this.isIdle()) {
            for (let cell of this.state.cells) {
                if (!cell.isLocked) cell.value = undefined;
            }
            this.forceUpdate();
        }
    };

    /**
     * React to a click on a cell
     * (toggle focus on the cell)
     *
     * @param {number} index the index of the clicked cell
     */
    clickCell(index) {
        this.setState({
            focusIndex: this.state.focusIndex === index ? undefined : index
        });
    }

    /**
     * React to keyboard events:
     * - A number (1-9) sets the value of the focused cell
     * - Backspace removes the value of the focused cell
     * - Arrow keys move focus to neighbor cells
     * - Escape removes the focus
     *
     * @param {KeyboardEvent} event the keyboard event
     */
    handleKeyDown(event) {
        event.preventDefault();
        const focusIndex = this.state.focusIndex;
        if (focusIndex !== undefined) {
            const focusCell = this.state.cells[focusIndex];
            let newFocusIndex = undefined;
            switch (event.key) {
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    if (this.isIdle() && !focusCell.isLocked) {
                        focusCell.value = Number(event.key);
                        this.forceUpdate();
                    }
                    break;
                case "Backspace":
                    if (this.isIdle() && !focusCell.isLocked) {
                        focusCell.value = undefined;
                        this.forceUpdate();
                    }
                    break;
                case "ArrowUp":
                    newFocusIndex = focusIndex - 9;
                    break;
                case "ArrowDown":
                    newFocusIndex = focusIndex + 9;
                    break;
                case "ArrowLeft":
                    newFocusIndex = focusIndex - 1;
                    break;
                case "ArrowRight":
                    newFocusIndex = focusIndex + 1;
                    break;
                case "Escape":
                    this.setState({ focusIndex: undefined });
                    break;
            }
            if (0 <= newFocusIndex && newFocusIndex < 81) {
                this.setState({ focusIndex: newFocusIndex });
            }
        }
    }

    render() {
        const hasFocus = this.state.focusIndex !== undefined;

        return (
            <div>
            <div className="grid" tabIndex="0" onKeyDown={this.handleKeyDown.bind(this)}>
                { this.state.cells.map((c, i) =>
                    <Cell
                        key={i}
                        index={i}
                        value={c.value}
                        isFocused={i === this.state.focusIndex}
                        isHighlighted={
                            hasFocus &&
                            (i % 9 === this.state.focusIndex % 9 ||
                            ~~(i / 9) === ~~(this.state.focusIndex / 9))}
                        isLocked={c.isLocked}
                        onClick={() => this.clickCell(i)}
                    />
                )}
            </div>
            <div id="buttons">
                <button onClick={() => this.generate()}>{this.state.worker === undefined ? "Generate" : "Stop"}</button>
                <button onClick={() => this.clear()}>Clear</button>
                <button onClick={() => this.solve()}>{this.state.worker === undefined ? "Solve" : "Stop"}</button>
                <button onClick={() => this.lock()}>Lock</button>
                <button onClick={() => this.unlock()}>Unlock</button>
            </div>
            </div>
        );
    }
}

class Cell extends React.Component {
    render() {
        let row = ~~(this.props.index / 9);
        let col = this.props.index % 9;
        let area = 3 * ~~(row / 3) + ~~(col / 3);
        let classes = ['cell', `R${row}`, `C${col}`, `A${area}`];
        if (this.props.isFocused) classes.push("focused");
        if (this.props.isLocked) classes.push("locked");
        if (this.props.isHighlighted) classes.push("highlighted");
        return (
            <div className={classes.join(' ')} onClick={this.props.onClick}>
                { this.props.value }
            </div>
        )
    }
}

ReactDOM.render(
    <Sudoku />,
    document.getElementById('app')
);

