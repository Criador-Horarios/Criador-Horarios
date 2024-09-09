type SpaceType = "CAMPUS" | "BUILDING" | "FLOOR" | "ROOM" | "ROOM_SUBDIVISION"
export type RoomInfo = { id: string, name: string}

export type Space = {
	id: string
	name: string
	fullName: string
	type: SpaceType
	classification: Record<string, string>
	capacity: {
		regular: number
		exam: number
	}
	description: string
	building?: {	
		id: string
		name: string
		fullName: string
		type: SpaceType
		classification: Record<string, string>
	}
	campus?: {
		id: string		
		name: string
		fullName: string
		type: SpaceType
		classification: Record<string, string>
	}
	containedIn: {
		id: string	
		name: string
		fullName: string
		type: SpaceType
		classification: Record<string, string>
	}
	contains: {
		id: string		
		name: string
		fullName: string
		type: SpaceType
		classification: Record<string, string>
	}[]
}
