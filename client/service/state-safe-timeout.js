import keyMaster from 'key-master'

export default mediator => {
	const domApiToChangeCount = keyMaster(() => 0, new WeakMap())

	mediator.provide('safeTimeout', (domApi, cb, timeoutMs) => {
		const count = domApiToChangeCount.get(domApi)
		setTimeout(() => {
			const newCount = domApiToChangeCount.get(domApi)
			if (count === newCount) {
				cb()
			} else {
				console.log('Cancelled callback!')
			}
		}, timeoutMs)
	})

	function onStateGoingAway({ state, domApi }) {
		domApiToChangeCount.set(domApi, domApiToChangeCount.get(domApi) + 1)
	}

	mediator.call('onStateRouter', 'beforeResetState', onStateGoingAway)
	mediator.call('onStateRouter', 'beforeDestroyState', onStateGoingAway)
}
