import hexRgb from 'hex-rgb'
import rgbHex from 'rgb-hex'
import Comparables from './comparables'

export interface Comparable {
    equals(obj: Comparable): boolean
    hashString(): string
}

export class Degree {
    id: string
    acronym: string
    name: string
    isSelected: boolean = false

    constructor(obj: any) {
        this.id = obj.id
        this.acronym = obj.acronym
        this.name = obj.name
    }

    displayName() : string {
        return this.acronym + ' - ' + this.name
    }

    static compare(a: Degree, b: Degree) {
        return a.displayName().localeCompare(b.displayName())
    }
}

export class Course implements Comparable {
    id: string
    acronym: string
    name: string
    academicTerm: string
    semester: number
    credits: string
    abbrev: string
    color: string
    isSelected: boolean = false

    constructor(obj: any) {
        this.id = obj.id
        this.acronym = obj.acronym.replace(/\d/g, '')
        this.name = obj.name
        this.academicTerm = obj.academicTerm
        this.semester = +this.academicTerm[0]
        this.credits = obj.credits
        this.abbrev = this.name.split(/[- //]+/).map(d => d[0]).filter(d => {
            if (!d) return false
            return d === d.toUpperCase()
        }).join("")

        // FIXME: Select from chosen colors, this ones suck
        const randomColor = () => Math.floor(Math.random()*256)
        this.color = '#' + rgbHex(randomColor(), randomColor(), randomColor())
    }

    equals(other: Course) {
        return this.name === other.name && this.semester === other.semester
    }

    hashString(): string {
        return this.name + this.semester
    }

    static compare(a: Course, b: Course) {
       const sem = a.semester < b.semester ? -1 : a.semester === b.semester ? 0 : 1
       return sem || a.name.localeCompare(b.name)
    }

    searchableName(): string {
        return this.abbrev + this.name + this.acronym
    }

    displayName() : string {
        return this.name
    }
}

export enum CourseUpdateType {
    Add,
    Remove,
    Clear
}

export class CourseUpdates {
    courses: Course[]
    lastUpdate?: Update

    constructor() {
        this.courses = []
    }

    toggleCourse(course: Course): CourseUpdateType {
        const idx = Comparables.indexOf(this.courses, course)

        let type
        if (idx !== -1) {
            type = CourseUpdateType.Remove
            this.courses.splice(idx, 1)
        } else {
            type = CourseUpdateType.Add
            this.courses.push(course)
        }

        this.lastUpdate = {
            type,
            course
        } as Update
        return type
    }
}

export type Update = {
    type: CourseUpdateType
    course: Course | undefined
}

// TODO: shades in RGB should use multiplication
const shadeColor = (color: string, amount: number) => {
    const newColor: any = hexRgb(color)
    Object.keys(newColor).forEach((key: string) => {
        newColor[key] += 20*amount
        newColor[key] = Math.min(Math.max(0, newColor[key]), 255)
    })
    return '#' + rgbHex(newColor.red, newColor.green, newColor.blue)
}

export class Shift implements Comparable {
    name: string
    type: string
    acronym: string
    shiftId: string
    courseName: string
    lessons: Lesson[]
    color: string
    
    constructor(obj: any, course: Course) {
        this.name = obj.name
        const re = /^([A-Za-z]+)\d*(L|PB|T|S)([\d]{2})$/
        const match = this.name.match(re)!
        this.acronym = match[1]
        this.type = match[2]
        this.shiftId = match[2] + match[3]
        this.courseName = course.name

        if (this.type === 'T') {
            this.color = shadeColor(course.color, 2)
        } else if (this.type === 'PB') {
            this.color = shadeColor(course.color, 1)
        } else {
            this.color = course.color
        }

        const lessons = obj.lessons.map((l: any) => {
            return new Lesson({
                shiftName: this.name,
                color: this.color,
                originalColor: course.color,
                start: l.start.split(' ')[1],
                end: l.end.split(' ')[1],
                dayOfWeek:  new Date(l.start).getDay(),
                room: l.room.name,
                campus: l.room.topLevelSpace.name,
                acronym: this.acronym,
                shiftId: this.shiftId,
                id: this.name
           })
        });
        this.lessons = Comparables.toUnique(lessons) as Lesson[]
    }

    static getShift(obj: any, course: any) {
        
    }

    static isSameCourseAndType(s1: Shift, s2: Shift): Boolean {
        return s1.courseName === s2.courseName && s1.type === s2.type && s1.name !== s2.name
    }

    equals(other: Shift) {
        return this.name === other.name
    }

    hashString() {
        return this.name
    }
}

export class Lesson implements Comparable {
    title: string
    type: string
    startTime: string
    endTime: string
    daysOfWeek: number[]
    originalColor: string
    color: string
    shiftId: string
    id: string

    constructor(obj: any) {
        this.daysOfWeek = [obj.dayOfWeek]
        this.startTime = obj.start
        this.endTime = obj.end
        this.color = obj.color
        this.originalColor = obj.originalColor
        this.shiftId = obj.shiftId
        this.type = obj.type
        this.id = obj.shiftName

        this.title = `${obj.acronym} - ${obj.shiftId}\n${obj.room} @ ${obj.campus}`
    }

    hashString(): string {
        return this.title + this.startTime + this.endTime
    }

    equals(other: Lesson) {
        return this.id === other.id
    }
}