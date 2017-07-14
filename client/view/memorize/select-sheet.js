import SelectSheet from './SelectSheet.html'

export default mannish => ({
	name: 'memorize.select-sheet',
	route: 'select',
	template: SelectSheet,
	resolve(data, { key }) {
		return Promise.resolve({
			key
		})
	}
})
