import EnterUrl from './EnterUrl.html'

export default mannish => ({
	name: 'enter-url',
	route: 'start',
	template: EnterUrl,
	activate(context) {
		const { domApi: component } = context
		component.on('keySelected', key => {
			mannish.call('stateGo', 'workbook', { key })
		})
	}
})
