import hexRgb from 'hex-rgb'
import rgbHex from 'rgb-hex'

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
}

export class Course {
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

        const randomColor = () => Math.floor(Math.random()*256)
        this.color = '#' + rgbHex(randomColor(), randomColor(), randomColor())
    }

    equals(other: Course) {
        return this.searchableName() === other.searchableName()
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
        let idx = -1
        for (let i = 0; i < this.courses.length; i++) {
            if (this.courses[i].equals(course)) {
                idx = i
                break
            }
        }

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

const shadeColor = (color: string, amount: number) => {
    const newColor: any = hexRgb(color)
    Object.keys(newColor).forEach((key: string) => {
        newColor[key] += 20*amount
        newColor[key] = Math.min(Math.max(0, newColor[key]), 255)
    })
    return '#' + rgbHex(newColor.red, newColor.green, newColor.blue)
}

export class Shift {
    name: string
    type: string
    lessons: Lesson[]
    color: string
    
    constructor(obj: any, color: string) {
        this.name = obj.name
        const re = /(L|PB|T)[\d]{2}/
        this.type = this.name.match(re)![1]

        if (this.type == 'T') {
            this.color = shadeColor(color, 2)
        } else if (this.type == 'PB') {
            this.color = shadeColor(color, 1)
        } else {
            this.color = color
        }

        const lessons: any = {}
        obj.lessons.forEach((l: any) => {
            const newEvent = new Lesson({
                shiftName: this.name,
                color: this.color,
                start: l.start.split(' ')[1],
                end: l.end.split(' ')[1],
                dayOfWeek:  new Date(l.start).getDay(),
                room: l.room.name,
                campus: l.room.topLevelSpace.name
           })
           // Sets work based on object id
           lessons[newEvent.toString()] = newEvent
        });
        this.lessons = Object.values(lessons) as Lesson[]
    }
}

export class Lesson {
    title: string
    startTime: string
    endTime: string
    daysOfWeek: number[]
    color: string

    constructor(obj: any) {
        this.title = `${obj.shiftName}\n${obj.room} @ ${obj.campus}`
        this.daysOfWeek = [obj.dayOfWeek]
        this.startTime = obj.start
        this.endTime = obj.end
        this.color = obj.color
    }

    toString(): string {
        return this.title + this.startTime + this.endTime
    }
}