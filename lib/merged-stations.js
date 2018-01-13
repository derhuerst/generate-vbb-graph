'use strict'

const stations = require('vbb-stations/full.json')
const instructions = require('merged-vbb-stations/instructions.json')

const mergedStations = Object.assign({}, stations)

for (let instruction of instructions) {
	if (instruction.op !== 'merge') {
		// this global logging in a utility module is a terrible hack!
		console.error('unsupported merge operation', op)
		continue
	}

	const {dest, stopName} = instruction
	const src = stations[instruction.src.id]

	let newDest = mergedStations[dest.id]
	if (!newDest) {
		newDest = mergedStations[dest.id] = Object.assign({}, dest)
		newDest.stops = Array.from(dest.stops)
	}

	for (let stop of src.stops) {
		if (newDest.stops.some(s => s.id === stop.id)) continue
		const newStop = Object.assign({}, stop, {
			station: newDest.id,
			name: stopName
		})
		newDest.stops.push(newStop)
	}
	delete mergedStations[src.id]
}

module.exports = mergedStations
