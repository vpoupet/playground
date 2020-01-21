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
        width: 100px;
        margin: 0 5px;
    }

    .card:not(:last-child) {
        margin-bottom: -120px;
    }

    .container {
        position: relative;
        height: 0;
        width: 100%;
        padding-bottom: 142.86%;
    }

    .inner {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        border: 1px black solid;
        border-radius: 10px;
        box-shadow: 3px 3px 3px var(--black-color);
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