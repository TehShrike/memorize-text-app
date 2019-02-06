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

		mediator.provide(`forgetWorkbook`, async(key) => 
			transaction(`readwrite`, store => store.delete(key))
		)
	} else {
		mediator.provide(`rememberWorkbook`, async() => {})
		mediator.provide(`getAllSeenWorkbooks`, async() => [])
	}
}
