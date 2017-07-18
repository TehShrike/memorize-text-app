import Workbook from './Workbook.html'
import sheetsy from 'sheetsy'

export default mediator => ({
	name: 'workbook',
	defaultChild: 'select-sheet',
	route: 'workbook/:key',
	template: Workbook,
	resolve(data, { key }) {
		return sheetsy.getWorkbook(key).then(workbook => ({
			workbook,
			key
		}))
	}
})
