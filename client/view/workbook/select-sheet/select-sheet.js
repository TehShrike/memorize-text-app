import SelectSheet from './SelectSheet.html'

export default mediator => ({
	name: `workbook.select-sheet`,
	route: `select`,
	template: SelectSheet,
	async resolve(data, { key }) {
		return {
			key,
		}
	},
})
