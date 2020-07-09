const test = require('ava')
const coffeePages = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => coffeePages(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(coffeePages('w'), 'w@zce.me')
  t.is(coffeePages('w', { host: 'wedn.net' }), 'w@wedn.net')
})
