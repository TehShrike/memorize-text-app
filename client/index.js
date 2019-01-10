import StateRouter from 'abstract-state-router'
import makeSvelteStateRenderer from 'svelte-state-renderer'
import mannish from 'mannish'
import makeAsrStateWatcher from 'asr-active-state-watcher'

import views from './globbed-views'
import statefulServices from './globbed-services'

const mediator = mannish()

const renderer = makeSvelteStateRenderer({
	methods: {
		call: mediator.call,
	},
})

const stateRouter = StateRouter(renderer, document.getElementById(`app-target`))

mediator.provide(`stateGo`, stateRouter.go)
mediator.provide(`onStateRouter`, (event, cb) => {
	stateRouter.on(event, cb)
})

const moduleInitializationPromises = statefulServices.map(module => module(mediator))

views.map(createView => createView(mediator)).forEach(stateRouter.addState)

stateRouter.on(`routeNotFound`, (route, parameters) => {
	stateRouter.go(`not-found`, { route }, { replace: true })
})

stateRouter.on(`stateChangeStart`, (state, params) => console.log(`stateChangeStart`, state.name, params))
stateRouter.on(`stateChangeError`, error => console.error(`stateChangeError`, error))
stateRouter.on(`stateError`, error => console.error(`stateError`, error))
stateRouter.on(`stateChangeEnd`, (state, params) => console.log(`stateChangeEnd`, state.name, params))

const stateWatcher = makeAsrStateWatcher(stateRouter)
stateWatcher.addDomApiAttachListener(domApi => {
	if (domApi.onStateInit) {
		domApi.onStateInit()
	}
})
stateWatcher.addDomApiDetachListener(domApi => {
	if (domApi.onStateCleanup) {
		domApi.onStateCleanup()
	}
})

Promise.all(moduleInitializationPromises).then(() => {
	stateRouter.evaluateCurrentRoute(`index`)
})

