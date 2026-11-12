import assert from 'node:assert/strict'
import test from 'node:test'
import { advance, BUMPERS, createGame, serve } from './physics.js'

test('short and charged launches leave the shooter lane', () => {
  for (const charge of [0, .5, 1]) {
    const game = createGame()
    game.charge = charge
    assert.ok(serve(game))
    let reachedTable = false
    for (let tick = 0; tick < 1200 && game.mode === 'play'; tick++) {
      advance(game, {})
      reachedTable ||= game.ball.x < 435
    }
    assert.ok(reachedTable, `launch power ${charge}`)
  }
})

test('the three wave bumpers light the set, and a top lane extends it', () => {
  const game = createGame()
  serve(game)
  for (const { x, y, r } of BUMPERS) {
    Object.assign(game.ball, { x, y: y + r + 8, vx: 0, vy: -400 })
    advance(game, {})
  }
  assert.deepEqual(game.lit, [true, true, true])
  assert.equal(game.score, 600)
  assert.equal(game.multiplier, 10)
  Object.assign(game.ball, { x: 145, y: 93, vx: 0, vy: -600 })
  advance(game, {})
  assert.equal(game.multiplier, 12)
  assert.equal(game.score, 900)
  assert.equal(game.best, 900)
})

test('a moving flipper can send a falling ball upward', () => {
  const game = createGame()
  serve(game)
  Object.assign(game.ball, { x: 190, y: 610, vx: 0, vy: 65 })
  for (let tick = 0; tick < 5 && !game.effects.includes('flip'); tick++) {
    advance(game, { left: true })
  }
  assert.ok(game.ball.vy < -400)
  assert.ok(game.effects.includes('flip'))
})

test('three drains end the game and preserve the best score', () => {
  const game = createGame(1000)
  for (let number = 1; number <= 3; number++) {
    assert.ok(serve(game))
    Object.assign(game.ball, { x: 240, y: 747, vx: 0, vy: 100 })
    advance(game, {})
    assert.equal(game.mode, number < 3 ? 'ready' : 'over')
  }
  assert.equal(game.number, 3)
  assert.equal(game.best, 1000)
  assert.equal(serve(game), false)
})
