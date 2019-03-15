import sheetsy from 'sheetsy'
import callMemoize from '../lib/call-memorize';

export default mediator => {
	const memoizedGetSheet = callMemoize(sheetsy.getSheet);
	mediator.provide(`getWorkbook`, sheetsy.getWorkbook);
	mediator.provide(`getSheet`, memoizedGetSheet);
}
