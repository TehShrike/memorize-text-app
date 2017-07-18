import sheetsy from 'sheetsy'

export default mannish => {
	mannish.provide('getWorkbook', sheetsy.getWorkbook)
	mannish.provide('getSheet', sheetsy.getSheet)
}
