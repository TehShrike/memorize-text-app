import smallIndexedDb from 'small-indexeddb'

export default async mediator => {
	const transaction = await smallIndexedDb(`seen-sheets2`).catch(err => {
		console.error(err)
		return null
	})

	if (transaction) {
		mediator.provide(`rememberWorkbook`, (key, name) =>
			transaction(`readwrite`, store => store.put({
				key,
				name,
			}, key))
		)

		mediator.provide(`getAllSeenWorkbooks`, async() =>
			transaction(`readonly`, store => store.getAll())
		)

		mediator.provide(`forgetWorkbook`, async(key) => {
    		const data = await transaction(`readonly`, store => store.get(key))
			
			sessionStorage.setItem(key, JSON.stringify(data));

			await transaction(`readwrite`, store => store.delete(key))
			window.location.replace("/#/home?messagetype=undo&messagecontent=Deck has been deleted&key=" + key)
		})
	} else {
		mediator.provide(`rememberWorkbook`, async() => {})
		mediator.provide(`getAllSeenWorkbooks`, async() => [])
	}
}
