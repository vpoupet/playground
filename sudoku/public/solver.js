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
 * A node in a grid of doubly-linked lists
 */
class Node {
    constructor(rowLabel=undefined) {
        /**
         * The column header
         * @type {Header}
         */
        this.header = undefined;
        /**
         * Index of the node's row
         * @type {number}
         */
        this.rowLabel = rowLabel;
        /**
         * Up neighbor node
         * @type {Node}
         */
        this.up = this;
        /**
         * Down neighbor node
         * @type {Node}
         */
        this.down = this;
        /**
         * Left neighbor node
         * @type {Node}
         */
        this.left = this;
        /**
         * Right neighbor node
         * @type {Node}
         */
        this.right = this;
    }

    /**
     * Returns an iterator that iterates through the node's row.
     *
     * @param {boolean} strict If true, the iteration skips the current node.
     * @param {boolean} reverse If true, the iteration goes leftward. If false, it goes rightward.
     * @returns {IterableIterator<Node>}
     */
    *iterateRow(strict=false, reverse=false) {
        if (!strict) yield this;
        let node = reverse ? this.left : this.right;
        while(node !== this) {
            yield node;
            node = reverse ? node.left : node.right;
        }
    }

    /**
     * Returns an iterator that iterates through the node's column.
     * The iterator skips the column header unless it its the current node (and parameter strict is false).
     *
     * @param {boolean} strict If true, the iteration skips the current node.
     * @param {boolean} reverse If true, the iteration goes upward. If false, it goes downward.
     * @returns {IterableIterator<Node>}
     */
    *iterateColumn(strict=false, reverse=false) {
        if (!strict) yield this;
        let node = reverse ? this.up : this.down;
        while(node !== this) {
            if (node !== this.header) yield node;
            node = reverse ? node.up : node.down;
        }
    }
}

/**
 * Representation of a column header
 */
class Header extends Node {
    constructor(label=undefined) {
        super();
        this.header = this;
        /**
         * Column label
         * @type {Object}
         */
        this.label = label;
        /**
         * Number of elements in the column
         * @type {number}
         */
        this.size = 0;
    }

    /**
     * Appends a Node at the end of the column (before the header)
     * @param {Node} node the node to be appended to the column
     */
    append(node) {
        node.header = this;
        node.down = this;
        node.up = this.up;
        node.up.down = node;
        node.down.up = node;
        this.size += 1;
        return node;
    }

    /**
     * Removes the column from the main structure and remove all rows that intersect it
     */
    cover() {
        this.left.right = this.right;
        this.right.left = this.left;
        for (let columnNode of this.iterateColumn(true)) {
            for (let lineNode of columnNode.iterateRow(true)) {
                lineNode.up.down = lineNode.down;
                lineNode.down.up = lineNode.up;
                lineNode.header.size -= 1;
            }
        }
    }

    /**
     * Restores the column in the main structure and all rows that intersect it
     */
    uncover() {
        for (let columnNode of this.iterateColumn(true, true)) {
            for (let lineNode of columnNode.iterateRow(true, true)) {
                lineNode.up.down = lineNode;
                lineNode.down.up = lineNode;
                lineNode.header.size += 1;
            }
        }
        this.left.right = this;
        this.right.left = this;
    }

    /**
     * Chooses a random node in the column
     * @returns {Node}
     */
    chooseRandomRow() {
        if (this.size === 0) {
            return undefined;
        } else {
            let index = ~~(Math.random() * this.size);
            let node = this.down;
            for (let i = 0; i < index; i++) {
                node = node.down;
            }
            return node;
        }
    }
}

/**
 * Represents an instance of an ExactCover problem, to be solved with the "dancing links" implementation.
 */
class ExactCover {
    /**
     * @param {boolean[][]} matrix Boolean matrix representing the input of the problem. Rows represent possible
     * choices and columns represent constraints. A solution of the problem is a list of rows that exactly cover all
     * columns.
     * @param {Object[]} rowLabels (optional) List of labels to assign to each row (choices)
     * @param {Object[]} colLabels (optional) List of labels to assign to each column (constraints)
     */
    constructor(matrix, rowLabels=undefined, colLabels=undefined) {
        let height = matrix.length;
        let width = matrix[0].length;

        if (rowLabels === undefined) {
            rowLabels = new Array(height).fill(0).map((c, i) => i);
        }
        if (colLabels === undefined) {
            colLabels = new Array(width).fill(0).map((c, i) => i);
        }

        // make and link headers
        let headers = new Array(width).fill(undefined).map((c, i) => new Header(colLabels[i]));
        for (let i = 0; i < width - 1; i++) {
            headers[i].right = headers[i + 1];
            headers[i + 1].left = headers[i];
        }
        // insert root
        this.root = new Header();
        this.root.right = headers[0];
        this.root.left = headers[headers.length - 1];
        this.root.right.left = this.root;
        this.root.left.right = this.root;
        this.rows = [];
        // make and link row nodes for each row
        for (let i = 0; i < height; i++) {
            let rowNodes = [];
            for (let j = 0; j < width; j++) {
                if (matrix[i][j]) {
                    let node = new Node(rowLabels[this.rows.length]);
                    headers[j].append(node);
                    rowNodes.push(node);
                }
            }
            for (let j = 0; j < rowNodes.length; j++) {
                rowNodes[j].right = rowNodes[(j + 1) % rowNodes.length];
                rowNodes[(j + 1) % rowNodes.length].left = rowNodes[j];
            }
            this.rows.push(rowNodes[0]);
        }

        this.solution = [];
    }

    /**
     * Adds a choice to the solution and removes the columns that intersect the choice's row
     *
     * @param choice The choice to be inserted.
     * @param choice.node {Node}
     * @param choice.iterator {IterableIterator<Node>}
     */
    pushChoice(choice) {
        // cover all columns that intersect the node's row
        for (let rowNode of choice.node.iterateRow()) {
            rowNode.header.cover();
        }
        this.solution.push(choice);
    }

    /**
     * Removes the last choice from the solution, and uncovers all columns that intersect the choice's row
     *
     * @returns {{node: Node, iterator: IterableIterator<Node>}} The choice that was removed.
     */
    popChoice() {
        let choice = this.solution.pop();
        if (choice === undefined) {
            // there is no choice to remove from the solution
            return undefined;
        } else if (choice.iterator === undefined) {
            // the choice has no iterator -> it should not be removed
            this.solution.push(choice);
            return undefined;
        } else {
            // uncover all columns that intersect the node's row
            for (let rowNode of choice.node.iterateRow(true, true)) {
                rowNode.header.uncover();
            }
            choice.node.header.uncover();
        }
        return choice;
    }

    /**
     * Attempts to solve the current problem
     *
     * @returns {boolean} true if a solution was found (in this.solution) false if no solution exists
     */
    solve() {
        if (this.root.right === this.root) {
            // if the problem is already solved, backtrack and find another solution
            let choice = this.backtrack();
            if (choice === undefined) {
                return false;
            }
            this.pushChoice(choice);
        }

        while (this.root.right !== this.root) {
            let choice;

            // try a node from the column with the least number of nodes
            let minHeader = this.root.right;
            for (let header of this.root.iterateRow(true)) {
                if (header.size < minHeader.size) {
                    minHeader = header;
                }
            }
            let node = minHeader.chooseRandomRow();
            if (node !== undefined) {
                // there was a node, add it to the solution and continue
                choice = {node: node, iterator: node.iterateColumn(true)};
            } else {
                // no node available with current choices -> backtrack
                choice = this.backtrack();
                if (choice === undefined) {
                    return false;
                }
            }
            this.pushChoice(choice);
        }
        return true;
    }

    backtrack() {
        let choice;
        while(true) {
            choice = this.popChoice();
            if (choice === undefined) {
                return undefined;
            }
            // try next node on same column (or backtrack more if none)
            let nextNode = choice.iterator.next();
            if (!nextNode.done) {
                choice.node = nextNode.value;
                return choice;
            }
        }
    }

    /**
     * @returns {boolean} true if the Sudoku has a unique solution, false if it either have no solution or more than
     * one solution.
     */
    hasSingleSolution() {
        return this.solve() && !this.solve();
    }
}

/**
 * Representation of a Sudoku constraint structure
 */
class Sudoku extends ExactCover {
    /**
     * @param values the list of 81 values attributed to each cell (all cells with values other than 1-9 will be
     * unassigned)
     */
    constructor(values=undefined) {
        if (Sudoku.matrix === undefined) {
            Sudoku.matrix = [];
            Sudoku.rowLabels = [];
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 9; x++) {
                    for (let v = 0; v < 9; v++) {
                        let row = Array(324).fill(false);
                        let a = ~~(y / 3) * 3 + ~~(x / 3);
                        row[9 * y + x] = true;
                        row[9 * x + v + 81] = true;
                        row[9 * y + v + 162] = true;
                        row[9 * a + v + 243] = true;
                        Sudoku.matrix.push(row);
                        Sudoku.rowLabels.push({x: x, y: y, a: a, v: v + 1});
                    }
                }
            }
            Sudoku.colLabels = [];
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 9; x++) {
                    Sudoku.colLabels.push({x: x, y: y});
                }
            }
            for (let x = 0; x < 9; x++) {
                for (let v = 0; v < 9; v++) {
                    Sudoku.colLabels.push({x: x, v: v + 1});
                }
            }
            for (let y = 0; y < 9; y++) {
                for (let v = 0; v < 9; v++) {
                    Sudoku.colLabels.push({y: y, v: v + 1});
                }
            }
            for (let a = 0; a < 9; a++) {
                for (let v = 0; v < 9; v++) {
                    Sudoku.colLabels.push({a: a, v: v + 1});
                }
            }
        }
        super(Sudoku.matrix, Sudoku.rowLabels, Sudoku.colLabels);
        if (values !== undefined) {
            for (let i = 0; i < values.length; i++) {
                if (1 <= values[i] && values[i] <= 9) {
                    this.pushChoice({node: this.rows[9 * i + values[i] - 1]});
                }
            }
        }
    }

    /**
     * Returns the solution as a list of 81 values to assign to each cell
     * @returns {Number[]}
     */
    getValues() {
        let values = Array(81);
        for (let choice of this.solution) {
            let label = choice.node.rowLabel;
            values[9 * label.y + label.x] = label.v;
        }
        return values;
    }

    static generate() {
        let s = new Sudoku();
        s.solve();
        let hints = s.getValues();
        let indexes = Array(81).fill(0).map((v, i) => i);
        indexes.shuffle();
        for (let i of indexes) {
            let h = hints[i];
            hints[i] = undefined;
            if (!new Sudoku(hints).hasSingleSolution()) {
                hints[i] = h;
            }
        }
        return hints;
    }
}

onmessage = function(event) {
    if (event.data.command === "solve") {
        let s = new Sudoku(event.data.values);
        if (s.solve()) {
            postMessage(s.getValues());
        } else {
            postMessage(undefined);
        }
    } else if (event.data.command === "generate") {
        postMessage(Sudoku.generate());
    }
};

// Examples

// let s1 = new Sudoku([
//     8, 2, 0, 0, 0, 0, 4, 0, 0,
//     0, 6, 9, 0, 8, 0, 0, 0, 0,
//     0, 0, 0, 3, 0, 0, 0, 1, 0,
//     0, 0, 0, 0, 0, 9, 0, 0, 0,
//     0, 0, 0, 0, 0, 1, 6, 4, 0,
//     0, 0, 8, 0, 7, 0, 5, 0, 0,
//     0, 0, 0, 4, 1, 0, 0, 0, 0,
//     4, 9, 2, 0, 0, 3, 0, 0, 0,
//     0, 0, 6, 0, 0, 8, 0, 0, 0]);
//
// let s2 = new Sudoku([
//     1, 2, 3, 4, 5, 6, 7, 8, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0,
//     2, 3, 4, 5, 6, 7, 8, 1, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0,
//     0, 0, 0, 0, 0, 0, 0, 0, 0]);
//
// let e = new ExactCover([
//     [true, false, false, false, true, false, false, false, true, false, false, false],
//     [true, false, false, false, false, false, true, false, false, false, true, false],
//     [false, true, false, false, false, true, false, false, true, false, false, false],
//     [false, true, false, false, false, false, false, true, false, false, true, false],
//     [false, false, true, false, true, false, false, false, false, true, false, false],
//     [false, false, true, false, false, false, true, false, false, false, false, true],
//     [false, false, false, true, false, true, false, false, false, true, false, false],
//     [false, false, false, true, false, false, false, true, false, false, false, true]
// ]);
