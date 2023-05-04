import hexRgb from 'hex-rgb'
import randomColor from 'randomcolor'
import rgbHex from 'rgb-hex'
import { isOkWithWhite } from './colors'

const selectedColors = new Set([
	'#c62828', '#6a1b9a', '#283593',
	'#0277bd', '#00695c', '#558b2f',
	'#6c6f00', '#ef6c00', '#4e342e', '#37474f'
])
const initialColors = new Set(selectedColors)

// FIXME: This should be for all courses and not for each timetable
export function getColor(): string {
	let chosenColor: string
	if (initialColors.size > 0) {
		chosenColor = Array.from(initialColors)[Math.floor(Math.random()*initialColors.size)]
		initialColors.delete(chosenColor)
	} else {
		const color = getRandomDarkColor()
		chosenColor = '#' + rgbHex(color.red, color.green, color.blue)
	}
	return chosenColor
}

export function returnColor(color: string): void {
	if (initialColors.has(color)) {
		selectedColors.add(color)
	}
}

export function getRandomDarkColor(): hexRgb.RgbaObject {
	let chosenColor: hexRgb.RgbaObject
	do {
		chosenColor = hexRgb(randomColor({
			luminosity: 'dark',
			alpha: 1,
			hue: 'random'
		}))
	} while (!isOkWithWhite(chosenColor))
	return chosenColor
}
