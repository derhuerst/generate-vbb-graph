'use strict'

const withoutDbRegioSuburban = (line) => {
	// Some DB Region AG suburban lines have the same name as S-Bahn
	// Berlin lines.
	return !(line.product === 'suburban' && line.operator === '108')
}

module.exports = withoutDbRegioSuburban
