<script>
    import Grid from './Grid.svelte';
</script>

<h1>Sudoku</h1>
<Grid/>
<div id="info">
    <h2>Instructions</h2>
    <ul>
        <li>Interaction with cells is done by clicking on one of the 3x3 subcells each representing a value from 1
            to 9:
            <ul>
                <li>Long-click on a cell's subcell to place a value in the cell</li>
                <li>Short-click on a cell's subcell to toggle a pencil annotation</li>
            </ul>
        </li>
        <li>The <strong>Generate</strong> button clears the grid and generates a new proper Sudoku (single solution, all hints
            required)
        </li>
        <li>The <strong>Clear</strong> button clears the value of all non-locked cells</li>
        <li>The <strong>Lock</strong> button locks all cells with a value</li>
        <li>The <strong>Unlock</strong> button unlocks all cells</li>
        <li>The <strong>Solve</strong> button searches for a solution of the current grid
            <ul>
                <li>Cell values cannot be changed while solver is running</li>
                <li>Solver can be interrupted by clicking on the same button (labeled "Stop" during computation)
                </li>
                <li>If a solution is found, values are displayed</li>
                <li>If no solution exists, the solver ends (button labeled "Solve" again) but cells are not
                    modified
                </li>
            </ul>
        </li>
    </ul>
</div>
