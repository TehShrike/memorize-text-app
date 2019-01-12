import smallIndexedDb from 'small-indexeddb'

export default async mediator => {
	const db = await smallIndexedDb(`seen-sheets`).catch(err => {
		console.error(err)
		return null
	})

	if (db) {
		mediator.provide(`rememberWorkbook`, (key, name) =>
			db.write([{
				key,
				value: {
					key,
					name,
				},
			}])
		)

		mediator.provide(`getAllSeenWorkbooks`, async() =>
			db.transaction(`readonly`, store => store.getAll())
		)
	} else {
		mediator.provide(`rememberWorkbook`, async() => {})
		mediator.provide(`getAllSeenWorkbooks`, async() => [])
	}
}
