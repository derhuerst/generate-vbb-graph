'use strict'

const allStations = require('vbb-stations/full.json')
const lines = require('vbb-lines')
const shorten = require('vbb-short-station-name')

// stop -> station mapping
const stationOf = {}
for (let id in allStations) {
	stationOf[id] = id
	for (let stop of allStations[id].stops) stationOf[stop.id] = id
}

const defaults = {
	filterLines: () => true,
	filterStations: () => true
}

const computeGraph = (nodes, edges, cb, opt = {}) => {
	const {filterLines, filterStations} = Object.assign({}, defaults, opt)

	const wroteNode = {} // by ID
	const wroteEdge = {} // by source ID + target ID + relation + metadata

	const writeStation = (id) => {
		const s = allStations[id]
		wroteNode[id] = true
		const node = {id: s.id, label: shorten(s.name), metadata: s.coordinates}
		nodes.write(node)
	}

	lines()
	.on('end', cb)
	.on('error', cb)
	.on('data', (l) => {
		if (!filterLines(l)) return false

		for (let v of l.variants) {
			for (let i = 0; i < (v.length - 1); i++) {
				const current = stationOf[v[i]]
				if (!filterStations(current)) return false
				const next = stationOf[v[i + 1]]

				if (!wroteNode[current]) writeStation(current)
				if (!wroteNode[next]) writeStation(next)

				const signature = [current, next, l.product, l.name].join('-')
				if (!wroteEdge[signature]) {
					wroteEdge[signature] = true
					edges.write({
						source: current,
						target: next,
						relation: l.product,
						metadata: {line: l.name}
					})
				}
			}
		}
	})
}

module.exports = computeGraph
