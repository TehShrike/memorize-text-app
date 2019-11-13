<script>
	import isTouchscreen from 'lib/is-touchscreen.js';
	import chunkPhrase from 'lib/phrase-chunker.js';
	import { tick } from 'svelte';

	const CHUNK_BARRIERS = new Set([`,`, `.`, `;`, `:`, `"`, `'`, `’`, `”`, `?`]);

	export let asr;
	export let sheet;
	export let workbook;

	let currentQuestionPosition = 0;
	let answerIsFullyVisible = false;
	let hintWordCount = 0;
	let visibleChunkIndex = 0;

	let currentCard;
	$: {
		const row = sheet.rows[currentQuestionPosition];

		currentCard = row
			? {
					prompt: row[0].trim(),
					answer: row[1].trim(),
			  }
			: null;
	}

	$: cardsInSheet = sheet.rows.length;

	$: displayHeader = sheet.name === `Sheet1` ? workbook.name : `${workbook.name} · ${sheet.name}`;

	$: answerWords = currentCard.answer.split(/\s+/g);

	$: chunkable = answerWords.length >= 20;

	$: phraseChunks = chunkable
		? chunkPhrase({
				words: answerWords,
				chunkMin: 2,
				chunkMax: 14,
				chunkIdeal: 3,
				chunkBarriers: CHUNK_BARRIERS,
		  })
		: answerWords.map((_, index) => index);

	$: visibleWords = phraseChunks[visibleChunkIndex] + hintWordCount;

	$: visibleAnswer = answerIsFullyVisible
		? currentCard.answer
		: answerWords.slice(0, visibleWords).join(` `);

	$: hiddenAnswer = answerIsFullyVisible ? `` : answerWords.slice(visibleWords).join(` `);

	$: wordsAreLeftToDisplay = !answerIsFullyVisible && visibleWords < answerWords.length;

	async function updateIfAnswerIsFullyVisible() {
		await tick();
		if (!wordsAreLeftToDisplay) answerIsFullyVisible = true;
	}
	function goToNextCard() {
		const incrementedPosition = currentQuestionPosition + 1;

		currentQuestionPosition = incrementedPosition >= cardsInSheet ? 0 : incrementedPosition;
		answerIsFullyVisible = false;
		hintWordCount = 0;
		visibleChunkIndex = 0;
	}
	function advance() {
		if (answerIsFullyVisible) goToNextCard();
		else {
			answerIsFullyVisible = true;
			hintWordCount = 0;
			visibleChunkIndex = phraseChunks.length - 1;
		}
	}
	function showMore() {
		if (wordsAreLeftToDisplay) {
			hintWordCount = 0;
			visibleChunkIndex = visibleChunkIndex + 1;
			updateIfAnswerIsFullyVisible();
		}
	}
	function showLess() {
		if (answerIsFullyVisible) {
			hintWordCount = 0;
			answerIsFullyVisible = false;
			visibleChunkIndex = phraseChunks.length - 2;
		} else if (hintWordCount > 0) hintWordCount = 0;
		else if (visibleChunkIndex > 0) {
			visibleChunkIndex = visibleChunkIndex - 1;
			hintWordCount = 0;
		}
	}
	function hint() {
		if (!answerIsFullyVisible && chunkable) {
			hintWordCount = hintWordCount + 1;

			updateIfAnswerIsFullyVisible();
		}
	}
	function keydown({ key }) {
		if (key === ` `) {
			advance();
		} else if (key === `h` || key === `H`) {
			hint();
		} else if (key === `,`) {
			showLess();
		} else if (key === `.`) {
			showMore();
		}
	}
</script>

<style>
	[data-hidden='true'] {
		visibility: hidden;
	}
	.key-identifier {
		font-family: monospace;
	}
	.faint {
		color: var(--lightBlack);
	}
	.box {
		padding: 32px;
		margin: 32px 8px;
		border-radius: 5px;
		box-shadow: 0 0 8px 4px var(--lightGray);
	}
	footer {
		display: flex;
		justify-content: space-between;
	}
	button {
		margin: 4px;
		width: 13rem;
	}
	:global([data-is-touchscreen='true']) button {
		width: 10rem;
	}
	@media (max-width: 600px) {
		footer {
			flex-direction: column;
		}
		footer * {
			flex-basis: 1.8rem;
			justify-content: center;
		}
		.footer-left {
			order: 1;
		}
		button {
			margin: 4px;
		}
		.box {
			padding: 16px;
			margin: 16px 8px;
		}
	}
	footer * {
		text-align: center;
	}
	.footer-center {
		flex-grow: 1;
	}
	.footer-left,
	.footer-right {
		flex-basis: 64px;
		display: flex;
		align-items: center;
	}
</style>

<svelte:window on:keydown={keydown} />

<div class="container">
	<main>
		<h1 style="text-align: center;">{displayHeader}</h1>

		{#if sheet.rows.length === 0}
			<h2>This sheet doesn't have any rows!</h2>
		{:else}
			<div class="box">
				<strong>{currentCard.prompt}</strong>
			</div>

			<div class="box">
				{visibleAnswer}
				<span
					data-hidden={visibleWords === 0 || !wordsAreLeftToDisplay}
					style="color: var(--gray);">
					…
				</span>

				<span style="visibility: hidden">{hiddenAnswer}</span>
			</div>
		{/if}
	</main>

	<footer>
		<div class="footer-left">
			<a href={asr.makePath('index')}>Home</a>
		</div>
		<div class="faint footer-center">
			<button on:click={showLess} disabled={visibleWords === 0}>
				Show less
				{#if !isTouchscreen}
					[<span class="key-identifier">,</span>]
				{/if}
			</button>
			<button on:click={showMore} disabled={answerIsFullyVisible}>
				Show more
				{#if !isTouchscreen}
					[<span class="key-identifier">.</span>]
				{/if}
			</button>
			<br />
			<button on:click={advance}>
				{#if answerIsFullyVisible}Next card{:else}Show all{/if}
				{#if !isTouchscreen}
					[<span class="key-identifier">Spacebar</span>]
				{/if}
			</button>
			<button on:click={hint} disabled={answerIsFullyVisible || !chunkable}>
				Hint
				{#if !isTouchscreen}
					[<span class="key-identifier">h</span>]
				{/if}
			</button>
		</div>
		<div class="faint footer-right nowrap">{currentQuestionPosition + 1} / {cardsInSheet}</div>
	</footer>

</div>
