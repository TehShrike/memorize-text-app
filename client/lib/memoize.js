export default (fn, cacheTimeMs) => {
	let lastCallArgs = null
	let lastCallResult = null
	let lastCallTime = 0

	return (...args) => {
		const thisCallArgs = args.map(arg => arg.replace(/,/g, `|comma|`)).join()

		const canUseCachedValue = lastCallTime
			&& thisCallArgs === lastCallArgs
			&& lastCallTime + cacheTimeMs >= new Date().getTime()

		if (!canUseCachedValue) {
			lastCallResult = fn(...args)
			lastCallArgs = thisCallArgs
			lastCallTime = new Date().getTime()
		}

		return lastCallResult
	}
}
