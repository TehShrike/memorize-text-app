<script>
	export let workbook;
	export let key;
	export let asr;
</script>

<style>
	.center {
		text-align: center;
	}
</style>

<div class="container">
	<div class="content">
		<h1 class="center">{workbook.name}</h1>

		{#if workbook.sheets.length === 1}
			<p class="center">Loading {workbook.sheets[0].name}...</p>
		{:else}
			<ol>
				{#each workbook.sheets as sheet}
					<li>
						{sheet.name} -
						<a
							href={asr.makePath('workbook.sheet.memorize', {
								sheetId: sheet.id,
								key,
							})}>
							memorize
						</a>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</div>
