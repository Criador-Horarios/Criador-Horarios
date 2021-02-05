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