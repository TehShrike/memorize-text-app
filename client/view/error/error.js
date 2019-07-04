import ErrorPage from './Error.html'

export default mediator => ({
	name: `error`,
	route: `error`,
	querystringParams: [ `key` ],
	template: ErrorPage,
	async resolve(data, params) {
		return params
	},
})
