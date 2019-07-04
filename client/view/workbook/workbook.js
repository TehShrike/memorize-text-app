import Workbook from './Workbook.html'
import exampleWorkbooks from 'lib/example-workbooks.js'

const exampleSheetKeysSet = new Set(exampleWorkbooks.map(({ key }) => key))
const catchify = promise => promise.then(value => [ null, value ]).catch(err => [ err ])

export default mediator => ({
	name: `workbook`,
	defaultChild: `select-sheet`,
	route: `workbook/:key`,
	template: Workbook,
	async resolve(data, { key }) {
		const [ err, workbook ] = await catchify(mediator.call(`getWorkbook`, key))

		if (err) {
			return Promise.reject({
				redirectTo: {
					name: `error`,
					params: {
						key,
					},
				},
			})
		}

		if (!exampleSheetKeysSet.has(key)) {
			mediator.call(`rememberWorkbook`, key, workbook.name)
		}

		return {
			workbook,
			key,
		}
	},
})
