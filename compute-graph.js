'use strict'

const allStations = require('vbb-stations/full.json')
const readLines = require('vbb-lines')

// stop -> station mapping
const stationOf = {}
for (let id in allStations) {
	stationOf[id] = id
	for (let stop of allStations[id].stops) stationOf[stop.id] = id
}

const computeGraph = async (nodes, edges) => {
	const lines = await readLines(true, 'all')
	const wroteNode = {} // byID

	for (let l of lines) {
		if (l.product !== 'suburban' && l.product !== 'subway') return false // todo

		for (let v of l.variants) {
			for (let i = 0; i < (v.length - 1); i++) {
				const current = stationOf[v[i]]
				const next = stationOf[v[i + 1]]

				if (!wroteNode[current]) {
					wroteNode[current] = true
					const s = allStations[current]
					nodes.write({id: s.id, label: s.name})
				}
				if (!wroteNode[next]) {
					wroteNode[next] = true
					const s = allStations[next]
					nodes.write({id: s.id, label: s.name})
				}

				edges.write({
					source: current,
					target: next,
					relation: l.product,
					metadata: {line: l.name}
				})
			}
		}
	}
}

module.exports = computeGraph
