import { Course, Degree, Shift } from "./domain";

export default class API {
    private static BASE_URL: string = "/api/fenix/v1"
    private static ACADEMIC_TERM: string = "2020/2021";

    private static async getRequest(url: string): Promise<any> {
        return await fetch(url).then(r => r.json())
    }

    public static async getDegrees(): Promise<Degree[]> {
        let res = await this.getRequest(`${this.BASE_URL}/degrees?academicTerm=${this.ACADEMIC_TERM}`);
        res = res.map((d: any) => new Degree(d))
        res.sort((a: Degree, b: Degree) => a.displayName().localeCompare(b.displayName()))
        return res;
    }

    public static async getCourses(degree: string): Promise<Course[]> {
        let res = await this.getRequest(`${this.BASE_URL}/degrees/${degree}/courses?academicTerm=${this.ACADEMIC_TERM}`);
        res = res.map((d: any) => new Course(d))
        // res.sort((a: Course, b: Course) => a.displayName().localeCompare(b.displayName()))
        return res;
    }

    public static async getCourseSchedules(course: string): Promise<Shift[]> {
        let res = await this.getRequest(`${this.BASE_URL}/courses/${course}/schedule?academicTerm=${this.ACADEMIC_TERM}`);
        res = res.shifts.map((d: any) => new Shift(d))
        // res.sort((a: Course, b: Course) => a.displayName().localeCompare(b.displayName()))
        return res;
    }
}