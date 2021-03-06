const isPotentialChunkWord = (word, chunkBarriers) => chunkBarriers.has(word[word.length - 1])

export default ({ words, chunkMin, chunkMax, chunkIdeal, chunkBarriers }) => {
	const chunks = [ 0 ]
	let lastWordNumber = 0
	let bestChunkSizeSoFar = null
	let index = 0
	const addChunk = chunkSize => {
		const wordNumber = chunkSize + lastWordNumber
		chunks.push(wordNumber)
		bestChunkSizeSoFar = null
		lastWordNumber = wordNumber
		index = wordNumber - 1
	}
	for (index = 0; index < words.length; ++index) {
		const word = words[index]
		const currentChunkSize = index - lastWordNumber + 1

		if (currentChunkSize >= chunkMax) {
			addChunk(bestChunkSizeSoFar || chunkIdeal)
		} else if (index === words.length - 1) {
			addChunk(currentChunkSize)
		} else if (isPotentialChunkWord(word, chunkBarriers)) {
			if (currentChunkSize >= chunkIdeal) {
				addChunk(currentChunkSize)
			} else if (currentChunkSize >= chunkMin) {
				bestChunkSizeSoFar = currentChunkSize
			}
		}
	}

	return chunks
}
