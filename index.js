if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/pinia-core.cjs.min.js')
} else {
  module.exports = require('./dist/pinia-core.cjs.js')
}
