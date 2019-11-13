<script>
	export let workbook;
	export let asr;
	export let key;
	export let mediatorCall;

	let forgotten = false;

	$: sheetIsSingle = workbook.sheets.length === 1;

	const sheetSentenceSeparator = index => {
		if (index === workbook.sheets.length - 1) {
			return `.`;
		} else if (index === workbook.sheets.length - 2) {
			return `, and `;
		}

		return `, `;
	};
	async function forgetAndPrepareForUndo(key) {
		mediatorCall(`forgetWorkbook`, key);
		forgotten = true;
	}
	function restoreWorkbook(key, workbook) {
		forgotten = false;
		mediatorCall(`rememberWorkbook`, key, workbook.name);
	}
</script>

<div class="container">

	<header>
		<h2>{workbook.name}</h2>
	</header>

	<main>
		{#if forgotten}
			{workbook.name} has been deleted.
			<br />
			<button on:click={() => restoreWorkbook(key, workbook)}>Restore</button>
		{:else}
			<p>This workbook has {workbook.sheets.length} sheet{sheetIsSingle ? '' : 's'}:</p>

			<p>
				{#if workbook.sheets.length == 1}
					<a
						href={asr.makePath('workbook.sheet.memorize', {
							key,
							sheetId: workbook.sheets[0].id,
						})}>
						{workbook.sheets[0].name}
					</a>
				{:else}
					{#each workbook.sheets as sheet, index}
						<a href={asr.makePath('workbook.sheet.memorize', {
							key,
							sheetId: sheet.id,
						})}>{sheet.name}</a>{sheetSentenceSeparator(index)}
					{/each}
				{/if}
			</p>

			<p>
				<a
					href="https://docs.google.com/spreadsheets/d/{key}"
					target="_blank"
					rel="external">
					View workbook on Google Sheets
				</a>
			</p>

			<button
				style="background-color: var(--red);"
				on:click={() => forgetAndPrepareForUndo(key)}>
				Remove "{workbook.name}" from the home page
			</button>
		{/if}
	</main>

	<footer>
		<div class="footer-left">
			<a href={asr.makePath('index')}>Home</a>
		</div>
	</footer>
</div>
