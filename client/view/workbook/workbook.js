import Workbook from './Workbook.html'
import exampleWorkbooks from 'global/example-workbooks.js'

const exampleSheetKeysSet = new Set(exampleWorkbooks.map(({ key }) => key))

export default mediator => ({
	name: `workbook`,
	defaultChild: `select-sheet`,
	route: `workbook/:key`,
	template: Workbook,
	async resolve(data, { key }) {
		const workbook = await mediator.call(`getWorkbook`, key)

		if (!exampleSheetKeysSet.has(key)) {
			mediator.call(`rememberWorkbook`, key, workbook.name)
		}

		return {
			workbook,
			key,
		}
	},
})
