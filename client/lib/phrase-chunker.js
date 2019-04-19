const isPotentialChunkWord = (word, chunkBarriers, scale) => chunkBarriers[scale] === word[word.length - 1];

export default ({ words, chunkMin, chunkMax, chunkIdeal, chunkBarriers }) => {

	const chunks = [0]
	let lastWordNumber = 0
	let bestChunkSizeSoFar = null
	let index = 0
	let scale = 0
	const addChunk = chunkSize => {
		const wordNumber = chunkSize + lastWordNumber
		chunks.push(wordNumber)
		bestChunkSizeSoFar = null
		lastWordNumber = wordNumber
		index = wordNumber - 1
		scale = 0
	}
	for (index = 0; index < words.length; ++index) {
		const word = words[index]
		const currentChunkSize = index - lastWordNumber + 1

		if (currentChunkSize >= chunkMax) {
			if (scale >= chunkBarriers.length - 1) addChunk(bestChunkSizeSoFar || chunkIdeal);
			else {
				scale++;
				index = lastWordNumber;
			}
		} else if (index === words.length - 1) {
			addChunk(currentChunkSize)
		} else if (isPotentialChunkWord(word, chunkBarriers, scale)) {
			if (currentChunkSize >= chunkIdeal) {
				addChunk(currentChunkSize)
			} else if (currentChunkSize >= chunkMin) {
				bestChunkSizeSoFar = currentChunkSize
			}
		}
	}

	return chunks
}
