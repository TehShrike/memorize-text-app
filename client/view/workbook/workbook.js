import Workbook from './Workbook.html'

export default mediator => ({
	name: `workbook`,
	defaultChild: `select-sheet`,
	route: `workbook/:key`,
	template: Workbook,
	async resolve(data, { key }, { redirect }) {
		const workbook = await mediator.call(`getWorkbook`, key)

		console.log(workbook.sheets)
		if (workbook.sheets.length === 1) {
			console.log(`redirecting to`, workbook.sheets[0].id)
			redirect(`workbook.sheet`, {
				key,
				sheetId: workbook.sheets[0].id,
			})
		}

		return {
			workbook,
			key,
		}
	},
})
