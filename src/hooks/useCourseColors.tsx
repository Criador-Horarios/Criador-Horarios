import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import Course from '../domain/Course'
import { isOkWithWhite } from '../utils/colors'
import hexRgb from 'hex-rgb'
import { getRandomDarkColor } from '../utils/CourseUpdate'
import rgbHex from 'rgb-hex'

export interface CourseColor {
	backgroundColor: string;
	textColor: string;
}

export interface CourseColorsContextInterface {
	getColorForCourse: (course: Course) => CourseColor;
	setColorForCourse: (course: Course, color: string) => void;
	ensureCoursesHaveColor: (courses: Course[]) => void;
}

const emptyState : CourseColorsContextInterface = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getColorForCourse: (course) => ({ backgroundColor: 'black', textColor: 'white' }),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	setColorForCourse: (course, color) => { return },
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	ensureCoursesHaveColor: (courses) => { return },
}

export const CourseColorsContext = createContext<CourseColorsContextInterface>(emptyState)

export const useCourseColors: () => CourseColorsContextInterface = () => useContext(CourseColorsContext)

interface CourseColorsProviderProps {
	children: React.ReactNode;
}

export function CourseColorsProvider ({ children } : CourseColorsProviderProps) : JSX.Element {
	// Record<course id, color hex>
	const [colors, setColors] = useState<Record<string, string>>({})

	const setColorForCourse = useCallback((course: Course, color: string) => {
		setColors(colors => ({...colors, [course.getId()]: color}))
	}, [setColors])

	const ensureCoursesHaveColor = useCallback((courses: Course[]) => {
		let newColors = colors
		for (const course of courses) {
			let color = colors[course.getId()]
			if (color === undefined) {
				const randomColor = getRandomDarkColor()
				color = `#${rgbHex(randomColor.red, randomColor.green, randomColor.blue)}`
				newColors = {...colors, [course.getId()]: color}
			}
		}
		setColors(newColors)
	}, [colors, setColors])
	
	const getColorForCourse = useCallback((course: Course) => {
		ensureCoursesHaveColor([course])
		const color = colors[course.getId()] || '#000'
		return {
			backgroundColor: color,
			textColor: isOkWithWhite(hexRgb(color)) ? 'white' : 'black'
		}
	}, [colors, ensureCoursesHaveColor])

	const value = useMemo(() => ({
		getColorForCourse,
		setColorForCourse,
		ensureCoursesHaveColor,
	}), [
		getColorForCourse,
		setColorForCourse,
		ensureCoursesHaveColor,
	])
	
	return (
		<CourseColorsContext.Provider
			value={value}
		>
			{children}
		</CourseColorsContext.Provider>
	)
}
