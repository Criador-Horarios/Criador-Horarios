import hexRgb from 'hex-rgb'
import rgbHex from 'rgb-hex'

const _MULT_1 = 1.30
const _MULT_2 = 1.15
const _MULT_3 = 1.00

export const getColor1 = (color: string): string => {
	return shadeColor(color, _MULT_1)
}

export const getColor2 = (color: string): string => {
	return shadeColor(color, _MULT_2)
}

export const getColor3 = (color: string): string => {
	return shadeColor(color, _MULT_3)
}

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