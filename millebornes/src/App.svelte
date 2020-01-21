<script>
    import Player from "./Player.svelte";
    import Card from "./Card.svelte";

    let players = [];
    addPlayer();
    addPlayer();
    let selectedPlayer = 0;

    function addPlayer() {
        const newPlayer = {
            name: `Player ${players.length + 1}`,
            cards: {25: 0, 50: 0, 75: 0, 100: 0, 200: 0},
        };
        players = [...players, newPlayer];
    }

    function removePlayer() {
        if (players.length >= 3) {
            players = players.slice(0, -1);
        }
        if (selectedPlayer >= players.length) {
            selectedPlayer = players.length - 1;
        }
	}

	function newGame() {
        for (let player of players) {
            player.cards = {25: 0, 50: 0, 75: 0, 100: 0, 200: 0};
        }
        players = players;
    }

	function selectPlayer(i) {
        selectedPlayer = i;
    }
	function addCard(value) {
        players[selectedPlayer].cards[value] += 1;
    }

</script>

<style>
    main {
        width: var(--main-width);
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    button {
        background-color: var(--white-color);
    }
    #buttons {
        margin: 5px 0;
    }

    #cards {
        width: 100%;
        display: flex;
        justify-content: space-between;
        flex-direction: row;
    }

    #cards .column {
        width: 18%;
    }

    #players {
        width: 100%;
    }
</style>

<main>
	<div id="buttons">
		<button on:click={addPlayer}>Add Player</button>
		<button on:click={removePlayer}>Remove Player</button>
        <button on:click={newGame}>New Game</button>
	</div>
    <div id="cards">
        <div class="column"><Card value="25" on:click={() => addCard(25)}/></div>
        <div class="column"><Card value="50" on:click={() => addCard(50)}/></div>
        <div class="column"><Card value="75" on:click={() => addCard(75)}/></div>
        <div class="column"><Card value="100" on:click={() => addCard(100)}/></div>
        <div class="column"><Card value="200" on:click={() => addCard(200)}/></div>
    </div>
    <div id="players">
        {#each players as player, i}
            <Player
                    name={player.name}
                    selected={selectedPlayer === i}
                    bind:cards={player.cards}
                    on:click={() => selectPlayer(i)} />
        {/each}
    </div>
</main>