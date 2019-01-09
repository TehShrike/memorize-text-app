import Workbook from './Workbook.html'

export default mediator => ({
	name: `workbook`,
	defaultChild: `select-sheet`,
	route: `workbook/:key`,
	template: Workbook,
	async resolve(data, { key }) {
		const workbook = await mediator.call(`getWorkbook`, key)

		console.log(workbook.sheets)
		if (workbook.sheets.length === 1) {
			throw {
				redirectTo: {
					key,
					sheetId: workbook.sheets[0].id,
				},
			}
		}

		return {
			workbook,
			key,
		}
	},
})
