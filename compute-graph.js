'use strict'

const mapping = require('merged-vbb-stations')
const deepEqual = require('lodash.isequal')
const pump = require('pump')
const readLines = require('vbb-lines')
const {Writable} = require('stream')
const readSchedules = require('vbb-trips').schedules
const shorten = require('vbb-short-station-name')

const allStations = require('./lib/merged-stations')

// stop -> station mapping
const stationOf = Object.create(null)
for (let id in allStations) {
	stationOf[id] = id
	for (let stop of allStations[id].stops) stationOf[stop.id] = id
}

// map remapped stations
for (let oldId in mapping) {
	if (!Object.prototype.hasOwnProperty.call(mapping, oldId)) continue
	const newId = mapping[oldId]
	if (newId === oldId) continue
	stationOf[oldId] = newId
}

const defaults = {
	filterLines: () => true,
	filterStations: () => true,
	projection: null,
	deduplicateVariants: (line) => line.variants,
	simpleDeduplication: false
}

const isEqualVariant = (model) => {
	const m = model.map(stop => stationOf[stop])
	return (variant) => {
		const v = variant.map(stop => stationOf[stop])
		return deepEqual(m, v)
	}
}

const computeGraph = (nodes, edges, cb, opt = {}) => {
	const {
		filterLines, filterStations,
		projection,
		deduplicateVariants
	} = Object.assign({}, defaults, opt)

	const wroteNode = Object.create(null) // by ID
	// by source ID + target ID + relation + metadata
	const wroteEdge = Object.create(null)

	const lines = Object.create(null) // by id
	const writeLine = (line, _, cb) => {
		if (filterLines(line)) {
			lines[line.id] = Object.assign({}, line, {
				variants: deduplicateVariants(line)
			})
		}
		cb()
	}

	const writeStation = (id) => {
		const s = allStations[id]
		wroteNode[id] = true
		const node = {id: s.id, label: shorten(s.name)}

		if (projection) {
			const {x, y} = projection({
				lat: s.location.latitude,
				lon: s.location.longitude
			})
			node.metadata = {
				x: Math.round(x * 1000 * 1000) / 1000,
				y: Math.round(y * 1000 * 1000) / 1000
			}
		} else node.metadata = s.location

		nodes.write(node)
	}

	const writeSchedule = (s, _, cb) => {
		const line = lines[s.route.line]
		if (!line) return cb() // todo: bail instead

		// check if this variant appears in the filtered list of line variants
		if (!line.variants.some(isEqualVariant(s.route.stops))) return cb()

		for (let i = 0; (i + 1) < s.route.stops.length; i++) {
			const current = stationOf[s.route.stops[i]]
			if (!filterStations(current)) continue
			if (!allStations[current]) {
				return cb(new Error('unknown station ' + current))
			}
			const next = stationOf[s.route.stops[i + 1]]
			if (!filterStations(next)) continue
			if (!allStations[next]) {
				return cb(new Error('unknown station ' + next))
			}

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

			let signature = [
				current, next,
				line.product, line.name
			]
			if (!opt.simpleDeduplication) signature.push(end - start)
			signature = signature.join('-')

			if (!wroteEdge[signature]) {
				wroteEdge[signature] = true
				edges.write({
					source: current,
					target: next,
					relation: line.product,
					metadata: {line: line.name, time: end - start}
				})
			}
		}
		cb()
	}

	pump(
		readLines(),
		new Writable({objectMode: true, write: writeLine}),
		(err) => {
			if (err) return cb(err)
			pump(
				readSchedules(),
				new Writable({objectMode: true, write: writeSchedule}),
				(err) => {
					if (err) return cb(err)
					nodes.end()
					edges.end()
					cb()
				}
			)
		}
	)
}

module.exports = computeGraph
