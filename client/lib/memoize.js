export default (fn) => {
	let storedArgs = [ ];
	let lastCallArgs = null;
	let lastCallResult = null;
	let recoveryLength = 1000;
	let lastCallTime = 0;
	return (...args) => {
		const thisCallArgs = args.map(arg => arg.replace(/,/g, '|comma|')).join();

		var storedArgsMatch = false;
		for (var argByOneIndex in storedArgs) {
			if (storedArgs[argByOneIndex].args == thisCallArgs && storedArgs[argByOneIndex].time + recoveryLength >= new Date().getTime()) {
				storedArgsMatch = true;
			}
		}

		if ((thisCallArgs === lastCallArgs && lastCallTime + recoveryLength >= new Date().getTime()) || storedArgsMatch) {
			return lastCallResult;
		}else{
			lastCallResult = fn(...args);
			lastCallArgs = thisCallArgs;
			lastCallTime = new Date().getTime();
			storedArgs.push({
				time: new Date().getTime(),
				args: thisCallArgs
			})
			return lastCallResult;
		}
	}
}