import memoize from './memoize.js'
import test from 'zora'
import delay from 'delay'

test(`Returns the old value if the arguments are the same`, t => {
	let functionCallCount = 0
	const memoizedFunction = memoize(() => {
		functionCallCount += 1
		return functionCallCount === 1 ? `first call` : `wat`
	}, 100)
	t.equal(memoizedFunction(`a`, `a`), `first call`)
	t.equal(memoizedFunction(`a`, `a`), `first call`)

	t.equal(functionCallCount, 1)
})

test(`Calls the function again if the arguments are different from last time`, t => {
	let functionCallCount = 0
	const memoizedFunction = memoize(() => functionCallCount += 1, 100)
	memoizedFunction(`a`, `a`)
	memoizedFunction(`a`, `b`)
	t.equal(functionCallCount, 2)
})

test(`Calls the function again after enough time has elapsed`, async t => {
	const CACHE_TIME = 100
	let functionCallCount = 0
	const memoizedFunction = memoize(() => functionCallCount += 1, CACHE_TIME)
	memoizedFunction(`a`, `a`)
	await delay(CACHE_TIME + 100)
	memoizedFunction(`a`, `a`)
	t.equal(functionCallCount, 2)
})

test(`Calls the function again with confusing arguments`, t => {
	let functionCallCount = 0
	const memoizedFunction = memoize(() => functionCallCount += 1, 100)
	memoizedFunction(`ab,c`, `1,23`)
	memoizedFunction(`ab`, `c,1,23`)
	memoizedFunction(`ab,c,1`, `23`)
	t.equal(functionCallCount, 3)
})
