import chunkify from './phrase-chunker.js'
import test from 'zora'

test('Chunks a dumb demo sentence with one word at the end', t => {
	const words = [ 'Tell', 'me', 'about', 'yourself.', 'I', 'really', 'want', 'to', 'know.', 'srsly' ]
	const chunks = chunkify({
		words,
		chunkMin: 4,
		chunkMax: 14,
		chunkIdeal: 8,
		chunkBarriers: [ '.' ],
	})
	t.deepEqual(chunks, [ 0, 9, 10 ])
})

test('Chunks a dumb demo sentence with two words at the end', t => {
	const words = [ 'Tell', 'me', 'about', 'yourself.', 'I', 'really', 'want', 'to', 'know.', 'srsly', 'dude' ]
	const chunks = chunkify({
		words,
		chunkMin: 4,
		chunkMax: 14,
		chunkIdeal: 8,
		chunkBarriers: [ '.' ],
	})
	t.deepEqual(chunks, [ 0, 9, 11 ])
})

test('Chunks a dumb demo sentence with three words at the end', t => {
	const words = [ 'Tell', 'me', 'about', 'yourself.', 'I', 'really', 'want', 'to', 'know.', 'srsly', 'dude', 'yarp' ]
	const chunks = chunkify({
		words,
		chunkMin: 4,
		chunkMax: 14,
		chunkIdeal: 8,
		chunkBarriers: [ '.' ],
	})
	t.deepEqual(chunks, [ 0, 9, 12 ])
})

test('Chunks a smart tricky sentence with challenging punctuation', t => {
	const words = "I feel pretty good right now, verily; everything is awesome".split(' ');
	const chunks = chunkify({
		words,
		chunkMin: 2,
		chunkMax: 14,
		chunkIdeal: 3,
		chunkBarriers: [ ';', ',' ],
	})
	t.deepEqual(chunks, [ 0, 7, 11 ])
})
