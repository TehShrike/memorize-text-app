<script>
	import ErrorPage from 'lib/component/ErrorPage.svelte';

	export let asr;
	export let key;
</script>

<ErrorPage {asr} {key}>We couldn't load that workbook!</ErrorPage>
