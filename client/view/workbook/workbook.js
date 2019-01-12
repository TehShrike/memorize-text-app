import Workbook from './Workbook.html'

export default mediator => ({
	name: `workbook`,
	defaultChild: `select-sheet`,
	route: `workbook/:key`,
	template: Workbook,
	async resolve(data, { key }) {
		const workbook = await mediator.call(`getWorkbook`, key)

		if (key !== `1C6EBjsS-FY6KPzKnHCVFEcpYy_Gh_bvAJWcma50Qwrw`) {
			mediator.call(`rememberWorkbook`, key, workbook.name)
		}

		return {
			workbook,
			key,
		}
	},
})
