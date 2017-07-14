import Memorize from './Memorize.html'
import sheetsy from 'sheetsy'

export default mannish => ({
	name: 'memorize',
	defaultChild: 'select-sheet',
	route: 'memorize/:key',
	template: Memorize,
	resolve(data, { key }) {
		return sheetsy.getSheetList(key).then(sheets => ({
			sheets,
			key
		}))
	}
})
