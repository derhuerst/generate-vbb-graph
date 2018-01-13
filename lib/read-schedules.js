'use strict'

const trips = require('vbb-trips')
const through = require('through2')

const readSchedules = (lines) => {
	return trips.schedules()
	.pipe(through.obj((schedule, _, cb) => {
		const line = lines[schedule.route.line]
		if (!line) return cb()

		schedule.route.line = line
		cb(null, schedule)
	}))
}

module.exports = readSchedules
