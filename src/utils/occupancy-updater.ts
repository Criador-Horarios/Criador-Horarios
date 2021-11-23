export default class OccupancyUpdater {
	// Singleton
	private static instance: OccupancyUpdater

	// Attributes
	private currentRate = 0
	private interval: NodeJS.Timeout | undefined = undefined

	// TODO: Receive updating function
	private constructor() {
		this.currentRate = 0
	}

	public static getInstance(): OccupancyUpdater {
		if (!OccupancyUpdater.instance) {
			OccupancyUpdater.instance = new OccupancyUpdater()
		}

		return OccupancyUpdater.instance
	}

	public static getRate(): number {
		return OccupancyUpdater.getInstance().currentRate
	}

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
			this.updateOccupancy() // Run the first time
			this.interval = setInterval(this.updateOccupancy, this.currentRate * 1000)
		}
	}

	private updateOccupancy(): void {
		console.log('Update!')

		// Clear itself if it can
		if (this.currentRate == 0 && this.interval) {
			clearInterval(this.interval)
		}
		return
	}
}

export const occupancyRates: Record<string, number> = {
	'Off': 0,
	'1s': 1, // FIXME: Remove as it is just for testing
	'10s': 10,
	'30s': 30,
	'1min': 60,
	'5min': 300
}