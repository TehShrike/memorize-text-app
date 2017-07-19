const red = '#FF4136'
const green = '#2ECC40'

const defaultFlashMs = 300

const convertMsToStyleString = ms => ms + 'ms'

export default mannish => {
	const body = document.body
	const initial = window.getComputedStyle(body).backgroundColor

	const startFlash = (color, timeString) => {
		window.requestAnimationFrame(() => {
			body.style.transition = 'background-color 0ms'
			body.style.backgroundColor = color
			window.requestAnimationFrame(() => {
				body.style.transition = `background-color ${timeString} ease-in-out`
				body.style.backgroundColor = initial
			})
		})
	}

	const flashPromise = (color, domApi, ms) => {
		startFlash(color, convertMsToStyleString(ms))
		return mannish.call('safeDelay', domApi, ms)
	}

	mannish.provide('badFlash', (domApi, ms = defaultFlashMs) => flashPromise(red, domApi, ms))
	mannish.provide('goodFlash', (domApi, ms = defaultFlashMs) => flashPromise(green, domApi, ms))
}
