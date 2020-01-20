<script>
    import Cell from './Cell.svelte';

    // An array of 81 objects containing the data of each cell:
    //   - value (number): the value of the cell (in [1, 9] or undefined if not set)
    //   - isLocked (boolean): whether the cell is currently locked
    //   - annotations: an array of 9 booleans indicating whether each of the possible annotations is set
    let cells = Array(81);
    for (let i = 0; i < 81; i++) {
        cells[i] = {
            value: undefined,
            isLocked: false,
            annotations: Array(9).fill(false),
        };
    }

    // The current active worker, or undefined if not currently solving
    let worker = undefined;

    function clearAnnotations() {
        for (let i = 0; i < 81; i++) {
            cells[i].annotations = Array(9).fill(false);
        }
    }

    /**
     * This function is called when the value of a cell is changed
     * e.detail contains
     *   - index: the index of the cell that is set
     *   - value: the new value for the cell
     */
    function onSetCellValue(e) {
        cells[e.detail.index].value = e.detail.value;
    }

    /**
     * This function is called when annotations for a cell are changed
     * e.detail contains
     *   - index: the index of the cell whose annotations are changed
     *   - value: the value of the annotation that is toggled (in [0, 8])
     */
    function onToggleAnnotation(e) {
        let index = e.detail.index;
        let value = e.detail.value;
        cells[index].annotations[value] = !cells[index].annotations[value];
    }

    /**
     * Lock all cells that currently have a value set
     */
    function lock() {
        for (let i = 0; i < 81; i++) {
            cells[i].isLocked = cells[i].value !== undefined;
        }
    }

    /**
     * Unlock all cells
     */
    function unlock() {
        for (let i = 0; i < 81; i++) {
            cells[i].isLocked = false;
        }
    }

    /**
     * Generate a new Sudoku grid
     * The generated grid has a single solution and all given values are necessary
     */
    function generate() {
        if (worker === undefined) {
            // start a new computation with a webworker
            worker = new Worker('./solver.js');
            worker.postMessage({command: "generate"});

            worker.onmessage = event => {
                if (event.data !== undefined) {
                    for (let i = 0; i < 81; i++) {
                        cells[i].value = event.data[i];
                    }
                    clearAnnotations();
                    lock();
                }
                worker.terminate();
                worker = undefined;
            };
        } else {
            // stop current computation
            worker.terminate();
            worker = undefined;
        }
    }

    /**
     * Solve the grid with current values
     * This method calls a webworker in the background to run the search algorithm
     */
    function solve() {
        if (worker === undefined) {
            // start a new computation with a webworker
            worker = new Worker('./solver.js');
            worker.postMessage({command: "solve", values: cells.map(c => c.value)});

            worker.onmessage = event => {
                if (event.data !== undefined) {
                    for (let i = 0; i < 81; i++) {
                        cells[i].value = event.data[i];
                    }
                }
                worker.terminate();
                worker = undefined;
            };
        } else {
            // stop current computation
            worker.terminate();
            worker = undefined;
        }
    }

    /**
     * Unset the value for all unlocked cells, and clear all annotations
     */
    function clear() {
        for (let i = 0; i < 81; i++) {
            if (!cells[i].isLocked) {
                cells[i].value = undefined;
            }
        }
        clearAnnotations();
    }
</script>

<div>
    <div class="grid">
        {#each cells as cell, i}
            <Cell
                    {...cell}
                    index={i}
                    on:toggleAnnotation={onToggleAnnotation}
                    on:setCellValue={onSetCellValue}
            />
        {/each}
    </div>
    <div id="buttons">
        <button on:click={generate}>{worker === undefined ? 'Generate' : 'Stop'}</button>
        <button on:click={clear}>Clear</button>
        <button on:click={solve}>{worker === undefined ? 'Solve' : 'Stop'}</button>
        <button on:click={lock}>Lock</button>
        <button on:click={unlock}>Unlock</button>
    </div>
</div>
