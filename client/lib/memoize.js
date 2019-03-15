export default (fn) => {
	let lastCallArgs = null;
	let lastCallResult = null;
	return (...args) => {
		const thisCallArgs = args.join();
		if (thisCallArgs === lastCallArgs) {
			return lastCallResult;
		}else{
			lastCallResult = fn(...args);
			lastCallArgs = thisCallArgs;
			return lastCallResult;
		}
	}
}