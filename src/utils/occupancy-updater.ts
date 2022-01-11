export default class OccupancyUpdater {
	// Singleton
	private static instance: OccupancyUpdater

	// Attributes
	private currentRate = 0
	private interval: NodeJS.Timeout | undefined = undefined
	private updater: (() => Promise<void>) | undefined = undefined
	private running = false

	private constructor() {
		this.currentRate = 0
	}

	public static getInstance(): OccupancyUpdater {
		if (!OccupancyUpdater.instance) {
			OccupancyUpdater.instance = new OccupancyUpdater()
		}

		return OccupancyUpdater.instance
	}

	public static setUpdateFunction(updater: () => Promise<void>): void {
		this.getInstance().updater = updater
	}

	public static getRate(): number {
		return OccupancyUpdater.getInstance().currentRate
	}

	// TODO: Change to static
	public changeRate(newRate: number): void {
		if (this.currentRate == newRate && newRate !== 0) {
			return
		}

		this.currentRate = newRate

		// Delete previous interval
		if (this.interval !== undefined) {
			clearInterval(this.interval)
		}

		// Create interval
		if (this.currentRate !== 0) {
			OccupancyUpdater.updateOccupancy() // Run the first time
			this.interval = setInterval(OccupancyUpdater.updateOccupancy, this.currentRate * 1000)
		}
	}

	private static async updateOccupancy(): Promise<void> {
		const currInstance = OccupancyUpdater.getInstance()
		if (currInstance.running) {
			// If other task is running, ignore this one
			return
		}

		// Clear itself if it can
		if (currInstance.currentRate == 0 && currInstance.interval) {
			clearInterval(currInstance.interval)
		}

		// Call occupancy updater
		currInstance.running = true
		await currInstance.updater?.call(currInstance)
		currInstance.running = false
	}
}

export const occupancyRates: Record<string, number> = {
	'Off': 0,
	// '1s': 1, // FIXME: Remove as it is just for testing
	'10s': 10,
	'30s': 30,
	'1min': 60,
	'5min': 300
}