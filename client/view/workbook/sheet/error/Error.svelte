<script>
	import ErrorPage from 'lib/component/ErrorPage.svelte';

	export let asr;
	export let key;
</script>

<ErrorPage {asr} {key}>
	We couldn't load any rows from this sheet! Make sure it has rows, and there aren't any blank
	rows.
</ErrorPage>
