import sheetsy from 'sheetsy'
import memoize from '../lib/memoize'

export default mediator => {
	const memoizedGetSheet = memoize(sheetsy.getSheet, 1000)
	mediator.provide(`getWorkbook`, sheetsy.getWorkbook)
	mediator.provide(`getSheet`, memoizedGetSheet)
}
