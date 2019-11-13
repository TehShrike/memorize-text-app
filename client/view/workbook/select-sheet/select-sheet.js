import SelectSheet from './SelectSheet.svelte';

export default mediator => ({
	name: `workbook.select-sheet`,
	route: `select`,
	template: SelectSheet,
	async resolve(data, { key }) {
		return {
			key,
		};
	},
	activate({ content, parameters }) {
		if (content.workbook.sheets.length === 1) {
			mediator.call(
				`stateGo`,
				`workbook.sheet.memorize`,
				{
					key: parameters.key,
					sheetId: content.workbook.sheets[0].id,
				},
				{
					replace: true,
					inherit: true,
				}
			);
		}
	},
});
