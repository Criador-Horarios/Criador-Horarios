export class Degree {
    id: string
    acronym: string
    name: string

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
    abbrev: string = ""

    constructor(obj: any) {
        this.id = obj.id
        this.acronym = obj.acronym
        this.name = obj.name
        this.academicTerm = obj.academicTerm
        this.semester = +this.academicTerm[0]
        this.credits = obj.credits
        // TODO: Improve this abbreviation
        this.abbrev = this.acronym.replace(/\d/g, '')
    }

    displayName() : string {
        return this.abbrev + ' - ' + this.name
    }
}

export enum CourseUpdateType {
    Add,
    Remove,
}

export class CourseUpdates {
    courses: Course[]
    lastUpdate?: Update

    constructor() {
        this.courses = []
    }

    toggleCourse(course: Course): CourseUpdateType {
        const idx = this.courses.indexOf(course)
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
        }
        return type
    }
}

export type Update = {
    type: CourseUpdateType
    course: Course
}

export enum WeekDay {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
}

export class Shift {
    name: string
    type: string
    start: string
    end: string
    dayOfWeek: number
    room: string
    campus: string
    
    constructor(obj: any) {
        this.name = obj.name
        this.type = obj.types[0]
        this.start = obj.lessons[0].start
        this.dayOfWeek = (new Date(this.start)).getDay() as WeekDay
        this.end = obj.lessons[0].end
        this.room = obj.lessons[0].room.name
        this.campus = obj.lessons[0].room.topLevelSpace.name
    }

    displayName(): string {
        return `${this.name}\n${this.room}`
    }

    toEvent(): any {
        return {
            title: this.displayName(),
            start: this.start,
            end: this.end,
            // TODO: Add random colors
            // color: 'red'
        }
    }
}