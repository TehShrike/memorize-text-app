import sheetsy from 'sheetsy'

export default mediator => {
	mediator.provide(`getWorkbook`, sheetsy.getWorkbook)
	mediator.provide(`getSheet`, sheetsy.getSheet)
}
