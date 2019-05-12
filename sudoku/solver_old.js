/**
 * Shuffle an array in place
 * (Fisher-Yates shuffle)
 */
Array.prototype.shuffle = function() {
    for (let i = 0; i < this.length - 1; i++) {
        let index = ~~(Math.random() * (this.length - i)) + i;
        let x = this[i];
        this[i] = this[index];
        this[index] = x;
    }
};

/**
 * Representation of a Sudoku grid
 */
class Grid {
    /**
     * @param {Number[]} values
     */
    constructor(values) {
        /**
         * List of all cells of the grid (81 cells)
         * @type {Cell[]}
         */
        this.cells = values.map((v, i) => new Cell(i, v, this));
    }

    /**
     * Assign values to all cells with `undefined` value, while verifying Sudoku constraints.
     * Cells that already have a value will not be changed.
     *
     * @returns {boolean} true if the grid could be filled entirely, false if no solution exists.
     */
    solve() {
        // check if initial values are conflicting
        for (let cell of this.cells) {
            if (cell.value !== undefined) {
                for (let neighbor of cell.getNeighbors()) {
                    if (cell.value === neighbor.value) {
                        // there is a conflict
                        return false;
                    }
                }
            }
        }

        // cells with no assigned value
        let unassignedCells = this.cells.filter(cell => cell.value === undefined);
        // cells that were given a value by the function (the value might be changed later)
        let assignedCells = [];

        // loop until all cells have been assigned a correct value
        while (unassignedCells.length > 0) {
            for (let cell of unassignedCells) {
                cell.updatePossibleValues();
            }
            unassignedCells.sort((c1, c2) => c1.possibleValues.size - c2.possibleValues.size);

            let c = unassignedCells.shift();
            let v = c.getNextValue();
            while (v === undefined) {
                // no more possible values for the cell
                c.value = undefined;
                unassignedCells.unshift(c);
                c = assignedCells.pop();    // change the value of the last assigned cell
                if (c === undefined) {
                    // if there are no previously assigned cells, the grid has no solution
                    return false;
                }
                v = c.getNextValue();
            }
            c.value = v;
            assignedCells.push(c);
        }
        return true;
    }
}

/**
 * Representation of a Sudoku grid cell
 */
class Cell {
    constructor(index, value, grid) {
        /**
         * Reference to the grid in which the cell is
         * @type {Grid}
         */
        this.grid = grid;
        /**
         * Row of the cell (top row is 0, bottom is 8)
         * @type {number}
         */
        this.row = ~~(index / 9);
        /**
         * Column of the cell (left column is 0, right is 8)
         * @type {number}
         */
        this.col = index % 9;
        /**
         * Order in which the cell will consider the possible possibleValues. Should be a permutation of possibleValues from 1 to 9.
         * Randomizing this order gives randomly generated solutions.
         * @type {number[]}
         */
        this.valuesOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.valuesOrder.shuffle();
        /**
         * Possible values for the cell according to Sudoku rules
         * @type {Set<Number>}
         */
        this.possibleValues = undefined;
        /**
         * Value currently given to the cell (`undefined` if the cell is empty)
         * @type {number}
         */
        this.value = value;
        /**
         * Whether the cell is locked (value cannot be changed)
         * @type {boolean}
         */
        this.isLocked = false;
    }

    /**
     * Update the set of possible values for a cell according to the values of the other cells in the grid
     */
    updatePossibleValues() {
        this.possibleValues = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let cell of this.getNeighbors()) {
            this.possibleValues.delete(cell.value);
        }
    }

    /**
     * Returns the set of all cells connected to the current cell (same line, column or area).
     * The returned set does not contain the current cell.
     * @returns {Set<Cell>}
     */
    getNeighbors() {
        let neighbors = new Set();
        for (let i = 0; i < 9; i++) {
            neighbors.add(this.grid.cells[9 * this.row + i]);
            neighbors.add(this.grid.cells[9 * i + this.col]);
        }
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                neighbors.add(this.grid.cells[9 * (3 * ~~(this.row / 3) + i) + (3 * ~~(this.col / 3) + j)]);
            }
        }
        neighbors.delete(this);
        return neighbors;
    }

    /**
     * Returns the next possible value for the cell.
     *
     * The returned value is the first value in the array `valuesOrder` that appears after the current cell value
     * (no restriction if the current value is `undefined`) and doesn't conflict with the possibleValues already assigned
     * to the other cells of the grid.
     *
     * @returns {number} the next value (according to the order in `valuesOrder`) that does not conflict with the
     * already assigned possibleValues in the grid. `undefined` if no more available possibleValues.
     */
    getNextValue() {
        for (let i = this.valuesOrder.indexOf(this.value) + 1; i < 9; i++) {
            if (this.possibleValues.has(this.valuesOrder[i])) {
                return this.valuesOrder[i];
            }
        }
        return undefined;
    }
}

onmessage = function(event) {
    let g = new Grid(event.data);
    if (g.solve()) {
        postMessage(g.cells.map(c => c.value));
    } else {
        postMessage(undefined);
    }
};

// let g1 = new Grid([8, 2, undefined, undefined, undefined, undefined, 4, undefined, undefined, undefined, 6, 9, undefined, 8, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 3, undefined, undefined, undefined, 1, undefined, undefined, undefined, undefined, undefined, undefined, 9, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1, 6, 4, undefined, undefined, undefined, 8, undefined, 7, undefined, 5, undefined, undefined, undefined, undefined, undefined, 4, 1, undefined, undefined, undefined, undefined, 4, 9, 2, undefined, undefined, 3, undefined, undefined, undefined, undefined, undefined, 6, undefined, undefined, 8, undefined, undefined, undefined]);
// let g2 = new Grid([1, 2, 3, 4, 5, 6, 7, 8, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 2, 3, 4, 5, 6, 7, 8, 1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined])