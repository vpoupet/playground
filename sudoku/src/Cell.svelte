<script>
    import {createEventDispatcher} from 'svelte';

    export let value;
    export let annotations;
    export let index;
    export let isLocked;
    let dispatch = createEventDispatcher();
    let pointerTimer = undefined;
    let pointerValue = undefined;
    let col = index % 9;
    let row = ~~(index / 9);

    function clearPointerTimer() {
        clearTimeout(pointerTimer);
        pointerValue = undefined;
    }

    function clearValue() {
        if (!isLocked) {
            dispatch('setCellValue', {index: index, value: undefined});
        }
    }

    function onPointerDown(i) {
        if (!isLocked) {
            if (pointerTimer !== undefined) {
                clearPointerTimer();
            }
            pointerTimer = setTimeout(() => {
                console.log(i);
                dispatch('setCellValue', {index: index, value: i + 1});
                clearPointerTimer();
            }, 250);
        }
    }

    function onPointerUp(i) {
        if (pointerTimer !== undefined) {
            clearPointerTimer();
            dispatch('toggleAnnotation', {index: index, value: i});
        }
    }

    function onPointerLeave() {
        clearPointerTimer();
    }
</script>

<div class="cell R{row} C{col} {isLocked ? 'locked' : ''}">
    {#if value !== undefined}
        <div class="big" on:click={clearValue}>
            {value}
        </div>
    {:else}
        {#each annotations as annotation, i}
            <div class="small"
                 on:pointerdown={() => onPointerDown(i)}
                 on:pointerup={() => onPointerUp(i)}
                         on:pointerleave={onPointerLeave}
            >
                {#if annotation}
                    {i + 1}
                {/if}
            </div>
        {/each}
    {/if}
</div>