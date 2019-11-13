import Memorize from './Memorize.svelte';

export default mediator => ({
	name: `workbook.sheet.memorize`,
	route: `memorize`,
	template: Memorize,
	async resolve(data, { key, sheetId }) {
		const sheet = await mediator.call(`getSheet`, key, sheetId);

		if (sheet.rows.length == 0) {
			return Promise.reject({
				redirectTo: {
					name: `workbook.sheet.error`,
					params: {
						key,
						sheetId,
					},
				},
			});
		}
	},
});
