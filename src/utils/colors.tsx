import hexRgb from 'hex-rgb'
import rgbHex from 'rgb-hex'

const _MULT_1 = 1.30
const _MULT_2 = 1.15
const _MULT_3 = 1.00

// On this get colors, the first one is the background color, and the next one is the contrast text color
export const getColor1 = (color: string): [string, string] => {
	const backgroundColor = shadeColor(color, _MULT_1)
	const textColor = isOkWithWhite(hexRgb(backgroundColor)) ? '#ffffff' : '#000000'
	return [backgroundColor, textColor]
}

export const getColor2 = (color: string): [string, string] => {
	const backgroundColor = shadeColor(color, _MULT_2)
	const textColor = isOkWithWhite(hexRgb(backgroundColor)) ? '#ffffff' : '#000000'
	return [backgroundColor, textColor]
}

export const getColor3 = (color: string): [string, string] => {
	const backgroundColor = shadeColor(color, _MULT_3)
	const textColor = isOkWithWhite(hexRgb(backgroundColor)) ? '#ffffff' : '#000000'
	return [backgroundColor, textColor]
}
// --

const shadeColor = (color: string, amount: number): string => {
	if (color === '') {
		return ''
	}
	const newColor = hexRgb(color)
	Object.keys(newColor).forEach((key: string) => {
		newColor[key as keyof hexRgb.RgbaObject] *= amount
		newColor[key as keyof hexRgb.RgbaObject] = Math.min(Math.max(0, newColor[key as keyof hexRgb.RgbaObject]), 255)
	})
	return '#' + rgbHex(newColor.red, newColor.green, newColor.blue)
}

export const isOkWithWhite = function(hexColor: hexRgb.RgbaObject): boolean {
	const C = [ hexColor.red/255, hexColor.green/255, hexColor.blue/255 ]
	for ( let i = 0; i < C.length; ++i ) {
		if ( C[i] <= 0.03928 ) {
			C[i] = C[i] / 12.92
		} else {
			C[i] = Math.pow( ( C[i] + 0.055 ) / 1.055, 2.4)
		}
	}
	const L = 0.2126 * C[0] + 0.7152 * C[1] + 0.0722 * C[2]
	return L <= 0.179
}