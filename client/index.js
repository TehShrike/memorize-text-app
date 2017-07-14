const StateRouter = require('abstract-state-router')
const makeSvelteStateRenderer = require('svelte-state-renderer')
const mannish = require('mannish')
const views = require('./globbed-views')

const mediator = mannish()

const renderer = makeSvelteStateRenderer({
	data: {
		call: mediator.call
	}
})

const stateRouter = StateRouter(renderer, document.getElementById('container'))

mediator.provide('stateGo', stateRouter.go)

views.map(createView => createView(mediator)).forEach(stateRouter.addState)

const statefulModules = require('./globbed-services')

const moduleInitializationPromises = statefulModules.map(module => module(mediator))

Promise.all(moduleInitializationPromises).then(() => {
	stateRouter.evaluateCurrentRoute('index')
})

stateRouter.on('stateChangeStart', (state, params) => console.log('stateChangeStart', state.name, params))
stateRouter.on('stateChangeError', error => console.error(error))
stateRouter.on('stateError', error => console.error(error))
stateRouter.on('stateChangeEnd', (state, params) => console.log('stateChangeEnd', state.name, params))
