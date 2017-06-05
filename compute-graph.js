'use strict'

const allStations = require('vbb-stations/full.json')
const readLines = require('vbb-lines')
const shorten = require('vbb-short-station-name')

const readSchedules = require('./read-schedules')

// stop -> station mapping
const stationOf = {}
for (let id in allStations) {
	stationOf[id] = id
	for (let stop of allStations[id].stops) stationOf[stop.id] = id
}

const defaults = {
	filterLines: () => true,
	filterStations: () => true,
	projection: null
}

const computeGraph = (nodes, edges, cb, opt = {}) => {
	const {filterLines, filterStations, projection} = Object.assign({}, defaults, opt)

	const wroteNode = {} // by ID
	const wroteEdge = {} // by source ID + target ID + relation + metadata

	const writeStation = (id) => {
		const s = allStations[id]
		wroteNode[id] = true
		const node = {id: s.id, label: shorten(s.name)}

		if (projection) {
			const {x, y} = projection({
				lat: s.coordinates.latitude,
				lon: s.coordinates.longitude
			})
			node.metadata = {
				x: Math.round(x * 1000 * 1000) / 1000,
				y: Math.round(y * 1000 * 1000) / 1000
			}
		} else node.metadata = s.coordinates

		nodes.write(node)
	}

	const lines = {} // by id
	readLines()
	.on('error', cb)
	.on('data', (l) => {
		if (filterLines(l)) lines[l.id] = l
	})
	.on('end', () => {
		readSchedules(lines)
		.on('error', cb)
		.on('data', (s) => {
			for (let i = 0; (i + 1) < s.route.stops.length; i++) {
				const current = stationOf[s.route.stops[i]]
				if (!filterStations(current)) return false
				const next = stationOf[s.route.stops[i + 1]]

				if (!wroteNode[current]) writeStation(current)
				if (!wroteNode[next]) writeStation(next)

				let start = s.sequence[i]
				if ('number' === typeof start.departure)  start = start.departure
				else if ('number' === typeof start.arrival) start = start.arrival
				else continue // todo

				let end = s.sequence[i + 1]
				if ('number' === typeof end.departure)  end = end.departure
				else if ('number' === typeof end.arrival) end = end.arrival
				else continue // todo

				const l = s.route.line
				const signature = [
					current, next,
					l.product, l.name,
					end - start
				].join('-')
				if (!wroteEdge[signature]) {
					wroteEdge[signature] = true
					edges.write({
						source: current,
						target: next,
						relation: l.product,
						metadata: {line: l.name, time: end - start}
					})
				}
			}
		})
		.on('end', cb)
	})
}

module.exports = computeGraph
