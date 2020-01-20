<script>
    import Cell from './Cell.svelte';

    // An array of 81 values in [1, 9] indicating the value in a cell, or undefined if the cell is empty
    let cellValues = Array(81).fill(undefined);
    // An array of 81 values containing for each cell an array of 9 booleans indicating which value annotations are
    // set
    let cellAnnotations = Array(81);
    for (let i = 0; i < 81; i++) {
        cellAnnotations[i] = Array(9).fill(false);
    }
    // An arrat of 81 booleans indicating whether each cell is locked (true) or not (false)
    let cellLocks = Array(81).fill(false);
    // The current active worker, or undefined if not currently solving
    let worker = undefined;

    /**
     * Return whether the app is idle (no worker currently solving) or not
     * @returns {boolean} true if there is an acitve worker, false otherwise
     */
    function isIdle() {
        return worker === undefined;
    }

    function onSetCellValue(e) {
        cellValues[e.detail.index] = e.detail.value;
    }

    function onToggleAnnotation(e) {
        cellAnnotations[e.detail.index][e.detail.value] = !cellAnnotations[e.detail.index][e.detail.value];
    }

    /**
     * Lock all cells that currently have a value set
     */
    function lock() {
        for (let i = 0; i < 81; i++) {
            cellLocks[i] = cellValues[i] !== undefined;
        }
    }

    /**
     * Unlock all cells
     */
    function unlock() {
        for (let i = 0; i < 81; i++) {
            cellLocks[i] = false;
        }
    }

    /**
     * Generate a new Sudoku grid
     * The generated grid has a single solution and all given values are necessary
     */
    function generate() {
        if (isIdle()) {
            // start a new computation with a webworker
            worker = new Worker('./solver.js');
            worker.postMessage({command: "generate"});

            worker.onmessage = event => {
                if (event.data !== undefined) {
                    cellValues = event.data;
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
        if (isIdle()) {
            // start a new computation with a webworker
            worker = new Worker('./solver.js');
            worker.postMessage({command: "solve", values: cellValues});

            worker.onmessage = event => {
                if (event.data !== undefined) {
                    cellValues = event.data;
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
            if (!cellLocks[i]) {
                cellValues[i] = undefined;
            }
            cellAnnotations[i] = Array(9).fill(false);
        }
    }
</script>

<div>
    <div class="grid">
        {#each cellValues as value, i}
        <Cell
                value={value}
                annotations={cellAnnotations[i]}
                isLocked={cellLocks[i]}
                index={i}
                on:toggleAnnotation={onToggleAnnotation}
                on:setCellValue={onSetCellValue} />
        {/each}
    </div>
    <div id="buttons">
        <button on:click={generate}>{worker === undefined ? 'Generate' : 'Stop'}</button>
        <button on:click={clear}>Clear</button>
        <button on:click={solve}>{isIdle() ? 'Solve' : 'Stop'}</button>
        <button on:click={lock}>Lock</button>
        <button on:click={unlock}>Unlock</button>
    </div>
</div>