import sheetsy from 'sheetsy'
import callMemoize from '../lib/memoize'

export default mediator => {
	const memoizedGetSheet = callMemoize(sheetsy.getSheet)
	mediator.provide(`getWorkbook`, sheetsy.getWorkbook)
	mediator.provide(`getSheet`, memoizedGetSheet)
}
