export default fn => {
	let lastCallArgs = null
	let lastCallResult = null
	const recoveryLength = 1000
	let lastCallTime = 0
	return (...args) => {
		const thisCallArgs = args.map(arg => arg.replace(/,/g, `|comma|`)).join()
		if (thisCallArgs === lastCallArgs && lastCallTime + recoveryLength >= new Date().getTime()) {
			return lastCallResult
		} else {
			lastCallResult = fn(...args)
			lastCallArgs = thisCallArgs
			lastCallTime = new Date().getTime()
			return lastCallResult
		}
	}
}
