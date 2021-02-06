import { Course, Degree, Shift } from "./domain";

export default class API {
    private static BASE_URL: string = "/api/fenix/v1"
    private static ACADEMIC_TERM: string = "2020/2021";

    private static async getRequest(url: string): Promise<any> {
        return await fetch(url).then(r => {
            const contentType = r.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1 && r.status === 200) {
                return r.json()
            } else {
                // TODO: improve this alert
                alert("API not answering properly.")
                return JSON.parse("[]")
            }
        })
    }

    public static async getDegrees(): Promise<Degree[]> {
        let res = await this.getRequest(`${API.BASE_URL}/degrees?academicTerm=${this.ACADEMIC_TERM}`);
        res = res.map((d: any) => new Degree(d))
        res.sort((a: Degree, b: Degree) => a.displayName().localeCompare(b.displayName()))
        return res;
    }

    public static async getCourses(degree: string): Promise<Course[]> {
        let res = await this.getRequest(`${API.BASE_URL}/degrees/${degree}/courses?academicTerm=${this.ACADEMIC_TERM}`);
        res = res.map((d: any) => new Course(d))
        // FIXME: Filter hardcoded
        res = res.filter( (c: Course) => {
            return c.semester === 2
        })
        res.sort((a: Course, b: Course) => {
            let sem = a.semester < b.semester ? -1 : a.semester === b.semester ? 0 : 1
            return sem || a.name.localeCompare(b.name)
        })
        return res;
    }

    public static async getCourseSchedules(course: Course): Promise<Shift[]> {
        let res = await this.getRequest(`${API.BASE_URL}/courses/${course.id}/schedule?academicTerm=${this.ACADEMIC_TERM}`);
        // FIXME: Not adding when a shift has two classes
        res = res.shifts.map((d: any) => new Shift(d, course.color))
        // res.sort((a: Course, b: Course) => a.displayName().localeCompare(b.displayName()))
        return res;
    }

    public static async getShortUrl(state: string): Promise<string> {
        return this.getRequest(`/tinyurl/api-create.php?url=https://${window.location.host}/${state}`)
    }
}