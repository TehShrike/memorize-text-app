export default mediator => {
	mediator.provide(`safeDelay`, (domApi, ms) => new Promise(resolve => {
		mediator.call(`safeTimeout`, domApi, resolve, ms)
	}))
}
