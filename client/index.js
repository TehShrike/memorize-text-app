import StateRouter from 'abstract-state-router'
import makeSvelteStateRenderer from 'svelte-state-renderer'
import mannish from 'mannish'
import NotFound from './NotFound.html'

import views from './globbed-views'
import statefulServices from './globbed-services'

const mediator = mannish()

const renderer = makeSvelteStateRenderer({
	data: {
		call: mediator.call
	}
})

const stateRouter = StateRouter(renderer, document.getElementById('container'))

mediator.provide('stateGo', stateRouter.go)

const moduleInitializationPromises = statefulServices.map(module => module(mediator))

views.map(createView => createView(mediator)).forEach(stateRouter.addState)

stateRouter.on('routeNotFound', (route, parameters) => {
	stateRouter.go('not-found', { route }, { replace: true })
})

stateRouter.addState({
	name: 'not-found',
	route: 'not-found',
	querystringParameters: [ 'route', 'parameters' ],
	template: NotFound,
	resolve(data, parameters) {
		return Promise.resolve(parameters)
	}
})

stateRouter.on('stateChangeStart', (state, params) => console.log('stateChangeStart', state.name, params))
stateRouter.on('stateChangeError', error => console.error(error))
stateRouter.on('stateError', error => console.error(error))
stateRouter.on('stateChangeEnd', (state, params) => console.log('stateChangeEnd', state.name, params))

Promise.all(moduleInitializationPromises).then(() => {
	stateRouter.evaluateCurrentRoute('index')
})

