import Memorize from './Memorize.html'

export default mediator => ({
	name: 'workbook.sheet.memorize',
	route: 'memorize',
	querystringParameters: [ 'number' ],
	defaultParameters: {
		number: 1
	},
	template: Memorize,
	resolve(data, parameters, { redirect }) {
		const number = parseInt(parameters.number, 10)
		if (Number.isNaN(number)) {
			redirect('not-found')
		} else {
			return Promise.resolve({
				number: parameters.number
			})
		}
	},
	activate({ content }) {
		if (!content.sheet.rows[content.number]) {
			mediator.call('stateGo', 'not-found', {}, { replace: true })
		}
	}
})
