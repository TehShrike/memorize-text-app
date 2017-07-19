export default mediator => {
	mediator.provide('safeDelay', (domApi, ms) => {
		return new Promise(resolve => {
			mediator.call('safeTimeout', domApi, resolve, ms)
		})
	})
}
