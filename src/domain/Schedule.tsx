import { ShiftDto } from './Shift'

export type ScheduleDto = {
	courseLoads: {
		totalQuantity: number
		type: string
		unitQuantity: number
	}[]
	lessonPeriods: {
		start: string
		end: string
	}[]
	shifts: ShiftDto[]
}