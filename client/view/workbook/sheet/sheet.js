import Sheet from './Sheet.html'
import sheetsy from 'sheetsy'

export default mannish => ({
	name: 'workbook.sheet',
	route: 'sheet/:sheetId',
	template: Sheet,
	resolve(data, { key, sheetId }) {
		return sheetsy.getSheet(key, sheetId).then(sheet => {
			return {
				sheet,
				sheetId
			}
		})
	}
})
