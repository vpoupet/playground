<script>
    import {createEventDispatcher} from "svelte";

    export let value;
    const dispatch = createEventDispatcher();

    function clickCard() {
        dispatch('clickCard', {value: value});
    }
</script>

<style>
    .card {
        width: var(--card-width);
    }

    .card:not(:last-child) {
        margin-bottom: calc(-.85 * var(--card-height));
    }

    .container {
        position: relative;
        height: 0;
        width: 100%;
        padding-bottom: calc(var(--card-ratio) * 100%);
    }

    .inner {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        border: 1px black solid;
        border-radius: calc(.05 * var(--card-width));
        --shadow-size: calc(.03 * var(--card-width));
        box-shadow: var(--shadow-size) var(--shadow-size) var(--shadow-size) var(--shadow-color);
    }

</style>
<div class="card">
    <div class="container">
        <div
                class="inner"
                style="background-image: url(images/distance{value}.png)"
                on:click>
        </div>
    </div>
</div>