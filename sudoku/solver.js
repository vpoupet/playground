/**
 * Representation of a Matrix cell as a link in doubly-linked lists.
 */
class Node {
    constructor() {
        /**
         * The column header
         * @type {Header}
         */
        this.header = undefined;
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
     * Removes the node from the column
     */
    remove() {
        this.up.down = this.down;
        this.down.up = this.up;
        this.header.size -= 1;
    }

    /**
     * Inserts the node back in its original column
     */
    restore() {
        this.up.down = this;
        this.down.up = this;
        this.header.size += 1;
    }

    /**
     * Returns the next node on the same column until reaching the first chosen node on the column
     * @returns {Node} the next Node or undefined if all nodes have been visited
     */
    getNextRow() {
        let nextNode = this.down;
        if (nextNode === this.header) nextNode = nextNode.down;
        if (nextNode !== this.header && nextNode !== this.header.firstChosen) {
            return nextNode;
        } else {
            return undefined;
        }
    }

    /**
     * Returns the label of the node row (union of all column header labels for all columns that intersect the
     * node's row)
     *
     * @returns {Object}
     */
    getLabel() {
        let label = {};
        let node = this;
        do {
            Object.assign(label, node.header.label);
            node = node.right;
        } while (node !== this);
        return label;
    }
}

/**
 * Representation of a column header
 */
class Header extends Node {
    constructor(name=undefined) {
        super();
        this.header = this;
        /**
         * Column label
         * @type {Object}
         */
        this.label = name;
        /**
         * Number of elements in the column
         * @type {number}
         */
        this.size = 0;
        /**
         * First node in the column that was randomly chosen during solving (if any)
         * @type {Node}
         */
        this.firstChosen = undefined;
    }

    /**
     * Appends a Node at the end of the column (before the header)
     * @param {Node} node
     * @returns {Node} the appended Node
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
        // remove header from list
        this.left.right = this.right;
        this.right.left = this.left;
        // remove all lines that intersect the column
        let columnNode = this.down;
        while (columnNode !== this) {
            // remove line
            let lineNode = columnNode.right;
            while (lineNode !== columnNode) {
                lineNode.remove();
                lineNode = lineNode.right;
            }
            columnNode = columnNode.down;
        }
    }

    /**
     * Restores the column in the main structure and all rows that intersect it
     */
    uncover() {
        // restore all lines that intersect the column
        let columnNode = this.up;
        while (columnNode !== this) {
            let lineNode = columnNode.left;
            while (lineNode !== columnNode) {
                lineNode.restore();
                lineNode = lineNode.left;
            }
            columnNode = columnNode.up;
        }
        // restore header to the list
        this.left.right = this;
        this.right.left = this;
    }

    /**
     * Chooses a random node in the column
     * @returns {Node} the selected Node
     */
    getRandomRow() {
        let index = ~~(Math.random() * this.size);
        let node = this.down;
        for (let i = 0; i < index; i++) {
            node = node.down;
        }
        this.firstChosen = node;
        return node;
    }
}

/**
 * Representation of a Sudoku constraint structure
 */
class Sudoku {
    /**
     * @param values the list of 81 values attributed to each cell (all cells with values other than 1-9 will be
     * unassigned)
     */
    constructor(values) {
        // create column headers (one for each constraint)
        let headers = [];
        // each cell must be filled
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                headers.push(new Header({row: row, col: col}));
            }
        }
        // each value must appear in each row
        for (let row = 0; row < 9; row++) {
            for (let i = 0; i < 9; i++) {
                headers.push(new Header({row: row, value: i + 1}));
            }
        }
        // each value must appear in each column
        for (let col = 0; col < 9; col++) {
            for (let i = 0; i < 9; i++) {
                headers.push(new Header({col: col, value: i + 1}));
            }
        }
        // each value must appear in each area
        for (let area = 0; area < 9; area++) {
            for (let i = 0; i < 9; i++) {
                headers.push(new Header({area: area, value: i + 1}));
            }
        }

        // link headers
        for (let i = 0; i < headers.length - 1; i++) {
            headers[i].right = headers[i + 1];
            headers[i + 1].left = headers[i];
        }
        this.root = new Header();
        this.root.right = headers[0];
        headers[0].left = this.root;
        this.root.left = headers[headers.length - 1];
        headers[headers.length - 1].right = this.root;

        /** @type {Array} List of nodes that correspond to lines that were initially assigned */
        let assignedNodes = [];

        // create and link nodes for each line
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                for (let i = 0; i < 9; i++) {
                    // add row of satisfied constraints
                    let area = 3 * ~~(row / 3) + ~~(col / 3);
                    let nodes = [
                        headers[9 * row + col].append(new Node()),
                        headers[81 + 9 * row + i].append(new Node()),
                        headers[162 + 9 * col + i].append(new Node()),
                        headers[243 + 9 * area + i].append(new Node()),
                    ];
                    if (values[9 * row + col] === i + 1) {
                        // this value is initially assigned (line is marked to be inserted in solution)
                        assignedNodes.push(nodes[0]);
                    }
                    for (let j = 0; j < nodes.length; j++) {
                        nodes[j].right = nodes[(j + 1) % nodes.length];
                        nodes[(j + 1) % 4].left = nodes[j];
                    }
                }
            }
        }

        this.solution = [];
        for (let node of assignedNodes) {
            this.pushChoice(node, false);
        }
    }

    /**
     * Backtracks in the solution (pop last choice and restore columns in the main structure) and returns the next
     * choice
     *
     * @returns {Node} the next choice to insert in the solution (undefined if no available choice,
     * puzzle has no solution)
     */
    backTrack() {
        while(this.solution.length > 0) {
            let node = this.solution.pop();
            // uncover all columns that intersect the node's row
            let rowNode = node.left;
            do {
                rowNode.header.uncover();
                rowNode = rowNode.left;
            } while (rowNode !== node.left);
            // try next node on same column (or backtrack more if none)
            node = node.getNextRow();
            if (node !== undefined) {
                return node;
            }
        }
        // nothing to backtrack (no solution)
        return undefined;
    }

    /**
     * Adds a choice to the solution and removes the columns that intersect the choice's row
     * @param {Node} node the choice's node
     * @param {boolean} canBacktrack whether the choice should be inserted in the solution for backtracking (false only
     * when setting initial values)
     */
    pushChoice(node, canBacktrack=true) {
        if (canBacktrack) this.solution.push(node);

        // cover all columns that intersect the node's row
        let rowNode = node;
        do {
            rowNode.header.cover();
            rowNode = rowNode.right;
        } while (rowNode !== node)
    }

    /**
     * Returns the first available column header with minimal size
     * @returns {Header}
     */
    getMinHeader() {
        let minHeader = this.root.right;
        let minSize = minHeader.size;
        let header = minHeader.right;
        while (header !== this.root) {
            if (header.size < minSize) {
                minSize = header.size;
                minHeader = header;
            }
            header = header.right;
        }
        return minHeader;
    }

    /**
     * Attempts to solve the current problem
     * @returns {boolean} true if a solution was found (in this.solution) false if no solution exists
     */
    solve() {
        this.solution = [];
        while (this.root.right !== this.root) {
            // pick column with smallest size
            let node;
            let header = this.getMinHeader();
            if (header.size === 0) {
                node = this.backTrack();
                if (node === undefined) return false;
            } else {
                node = header.getRandomRow();
            }
            this.pushChoice(node);
        }
        return true;
    }

    /**
     * Returns the solution as a list of 81 values to assign to each cell
     * @returns {Number[]}
     */
    getValues() {
        let values = Array(81);
        for (let node of this.solution) {
            let label = node.getLabel();
            values[9 * label.row + label.col] = label.value;
        }
        return values;
    }
}

onmessage = function(event) {
    let s = new Sudoku(event.data);
    if (s.solve()) {
        postMessage(s.getValues());
    } else {
        postMessage(undefined);
    }
};

// let s1 = new Sudoku([8, 2, undefined, undefined, undefined, undefined, 4, undefined, undefined, undefined, 6, 9, undefined, 8, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 3, undefined, undefined, undefined, 1, undefined, undefined, undefined, undefined, undefined, undefined, 9, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1, 6, 4, undefined, undefined, undefined, 8, undefined, 7, undefined, 5, undefined, undefined, undefined, undefined, undefined, 4, 1, undefined, undefined, undefined, undefined, 4, 9, 2, undefined, undefined, 3, undefined, undefined, undefined, undefined, undefined, 6, undefined, undefined, 8, undefined, undefined, undefined]);
// let s2 = new Sudoku([1, 2, 3, 4, 5, 6, 7, 8, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 2, 3, 4, 5, 6, 7, 8, 1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined])