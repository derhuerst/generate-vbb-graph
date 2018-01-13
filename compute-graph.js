'use strict'

const mapping = require('merged-vbb-stations')
const deepEqual = require('lodash.isequal')
const readLines = require('vbb-lines')
const shorten = require('vbb-short-station-name')

const allStations = require('./lib/merged-stations')
const readSchedules = require('./lib/read-schedules')

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

	const wroteNode = {} // by ID
	const wroteEdge = {} // by source ID + target ID + relation + metadata

	const writeStation = (id) => {
		const s = allStations[id]
		if (!s) return // todo: log err
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

	const lines = Object.create(null) // by id
	readLines()
	.on('error', cb)
	.on('data', (line) => {
		if (!filterLines(line)) return

		lines[line.id] = Object.assign({}, line, {
			variants: deduplicateVariants(line)
		})
	})
	.on('end', () => {
		readSchedules(lines)
		.on('error', cb)
		.on('data', (s) => {
			const line = s.route.line
			// check if this variant appears in the filtered list of line variants
			if (!line.variants.some(isEqualVariant(s.route.stops))) return

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
		})
		.on('end', cb)
	})
}

module.exports = computeGraph
