import memoize from './memoize.js'
import test from 'zora'
import delay from 'delay';

test('Returns the old value if the arguments are the same', t => {
	let functionCallCount = 0
	const memoizedFunction = memoize(() => {
		functionCallCount += 1
		return functionCallCount === 1 ? 'first call' : 'wat'
	})
	t.equal(memoizedFunction('a', 'a'), 'first call')
	t.equal(memoizedFunction('a', 'a'), 'first call')

	t.equal(functionCallCount, 1)
})

test('Calls the function again if the arguments are different from last time', t => {
	let functionCallCount = 0
	const memoizedFunction = memoize(() => functionCallCount += 1)
	memoizedFunction('a', 'a')
	memoizedFunction('a', 'b')
	t.equal(functionCallCount, 2)
})

test('Calls the function again after 1.01 seconds', async t => {
	let functionCallCount = 0
	const memoizedFunction = memoize(() => functionCallCount += 1)
	memoizedFunction('a', 'a')
	await delay(1010);
	memoizedFunction('a', 'a')
	t.equal(functionCallCount, 2)
})