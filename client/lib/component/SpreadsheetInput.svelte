<script>
	import sheetsy from 'sheetsy';

	export let mediatorCall;
	export let label = null;

	const { urlToKey } = sheetsy;

	let sheetUrl = ``;
	let error = null;

	function onsubmit(event) {
		event.preventDefault();

		console.log(mediatorCall);

		try {
			const key = urlToKey(sheetUrl);
			mediatorCall(`stateGo`, `workbook`, { key });
		} catch (err) {
			error = err;
		}
	}
</script>

<style>
	.row {
		display: grid;
		width: 100%;
		grid-gap: 8px;
		grid-template-columns: 1fr 0fr;
	}
	.row button {
		align-self: end;
	}
</style>

<form on:submit={onsubmit}>
	<div class="row">
		{#if label}
			<label>
				{label}
				<input
					type="text"
					bind:value={sheetUrl}
					placeholder="https://docs.google.com/spreadsheets/d/1C6EBjsS-FY6KPzKnHCVFEcpYy_Gh_bvAJWcma50Qwrw/edit?usp=sharing" />
			</label>
		{:else}
			<input
				aria-label="Google Sheets share url"
				type="text"
				bind:value={sheetUrl}
				placeholder="https://docs.google.com/spreadsheets/d/1C6EBjsS-FY6KPzKnHCVFEcpYy_Gh_bvAJWcma50Qwrw/edit?usp=sharing" />
		{/if}
		<button type="submit">Load sheet</button>
	</div>
	{#if error}
		<div class="error-color">Error: {error}</div>
	{/if}
</form>
