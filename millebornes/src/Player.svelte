<script>
    import Card from "./Card.svelte";
    import {createEventDispatcher} from "svelte";

    export let name;
    export let selected;
    export let cards;
    const dispatch = createEventDispatcher();
    let score;
    $: {
        score = 0;
        for (let value in cards) {
            score += value * cards[value];
        }
    }

    function removeCard(value) {
        if (!selected) {
            dispatch('click');
        } else {
            cards[value] -= 1;
        }
    }

    function editName() {
        console.log("edit");
    }
</script>

<style>
    .player {
        margin: 10px 0;
        padding: 5px;
        border: 3px solid #CEE4F2;
        border-radius: 10px;
        background-color: var(--light-blue-color);
    }

    .player.selected {
        border-color: black;
        box-shadow: 3px 3px 3px var(--black-color);
    }

    .name {
        font-size: 24pt;
        display: inline-block;
    }

    .cards {
        display: flex;
        flex-direction: row;
        min-height: 200px;
    }

    .cards .column {
        display: flex;
        flex-direction: column;
        width: 110px;
    }

    .track {
        position: relative;
        display: flex;
        width: 100%;
        height: 40px;
        margin-top: 10px;
        border: 1px black solid;
        background-color: #d1d1d1;
    }

    .track hr {
        position: absolute;
        top: 20px;
        border:none;
        border-top:5px dashed #fff;
        width:100%;
    }

    .covered {
        height: 100%;
        background-color: var(--light-green-color);
    }

    .distance {
        font-size: 20pt;
        position: absolute;
        top: 0;
        width: 100%;
        text-align: center;
    }
</style>

<div class="player{selected ? ' selected' : ''}" on:click>
    <div class="name" contenteditable="true">{name}</div>
    <div class="cards">
        {#each Object.keys(cards) as value}
            <div class="column">
                {#each Array(cards[value]).fill(0) as _}
                    <Card value={value} on:click={() => removeCard(value)}/>
                {/each}
            </div>
        {/each}
    </div>
    <div class="track">
        <div class="covered" style={`width: ${score / 10}%`}></div>
        <hr>
        <div class="distance">{score} km</div>
    </div>
</div>