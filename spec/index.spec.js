'use strict' /* eslint-env jasmine */
/**
 * @license
 * Copyright 2018 Stephane M. Catala
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * Limitations under the License.
 */
const withEventHandlerProps = require('../').default
const Subject = require('rxjs/Subject').Subject

describe('withEventHandlerProps:', function () {
  describe('when called with a string:', function () {
    let op, src$, subscribe, subscription

    beforeEach(function () {
      op = withEventHandlerProps('baz')
      src$ = new Subject()
      const next = jasmine.createSpy('next')
      const error = jasmine.createSpy('error')
      const complete = jasmine.createSpy('complete')
      subscribe = function () {
        subscription = op(src$).subscribe(next, error, complete)
      }
    })

    it('returns an RxJS Operator', function () {
      expect(op).toEqual(jasmine.any(Function))
      expect(subscribe).not.toThrow()
      expect(subscription).toBeDefined()
      expect(subscription.unsubscribe).toEqual(jasmine.any(Function))
    })

    describe('the returned RxJS Operator:', function () {
      describe('when its input observable emits an object:', function () {
        let next, error, complete

        beforeEach(function () {
          next = jasmine.createSpy('next')
          error = jasmine.createSpy('error')
          complete = jasmine.createSpy('complete')
          const op = withEventHandlerProps('baz')
          const src$ = new Subject()
          const sub = op(src$).subscribe(next, error, complete)
          src$.next({ foo: 'foo' })
          src$.next({ bar: 'bar' })
          sub.unsubscribe()
        })

        it('its output observable emits an object that extends the input object ' +
        'with an EventHandlerProp', function () {
          expect(next.calls.argsFor(0)).toEqual([{
            foo: 'foo',
            onBaz: jasmine.any(Function)
          }])
          expect(next.calls.argsFor(1)).toEqual([{
            bar: 'bar',
            onBaz: jasmine.any(Function)
          }])
          expect(error).not.toHaveBeenCalled()
          expect(complete).not.toHaveBeenCalled()
        })
      })

      describe('when the handler from the EventHandlerProp is called:', function () {
        let next, error, complete

        beforeEach(function () {
          next = jasmine.createSpy('next')
          error = jasmine.createSpy('error')
          complete = jasmine.createSpy('complete')
          const op = withEventHandlerProps('baz')
          const src$ = new Subject()
          let onBaz
          next.and.callFake(function (x) {
            onBaz = x.onBaz
          })
          const sub = op(src$).subscribe(next, error, complete)
          src$.next({ foo: 'foo' })
          onBaz('bar')
          sub.unsubscribe()
        })

        it('its output observable emits an object that extends ' +
        'the previously emitted input object with the EventHandlerProp ' +
        'and a prop mapped from the event with the event-to-event-prop function:',
        function () {
          expect(next.calls.argsFor(0)).toEqual([{
            foo: 'foo',
            onBaz: jasmine.any(Function)
          }])
          expect(next.calls.argsFor(1)).toEqual([{
            foo: 'foo',
            onBaz: jasmine.any(Function),
            event: { id: 'baz', payload: 'bar' }
          }])
          expect(error).not.toHaveBeenCalled()
          expect(complete).not.toHaveBeenCalled()
        })
      })

      describe('when the input observable completes with an error', function () {
        let next, error, complete

        beforeEach(function () {
          next = jasmine.createSpy('next')
          error = jasmine.createSpy('error')
          complete = jasmine.createSpy('complete')
          const op = withEventHandlerProps('event')
          const src$ = new Subject()
          const sub = op(src$).subscribe(next, error, complete)
          src$.error('boom')
          sub.unsubscribe()
        })

        it('the output observable completes with that error', function () {
          expect(next).not.toHaveBeenCalled()
          expect(complete).not.toHaveBeenCalled()
          expect(error).toHaveBeenCalledWith('boom')
        })
      })

      describe('when the input observable completes', function () {
        let next, error, complete

        beforeEach(function () {
          next = jasmine.createSpy('next')
          error = jasmine.createSpy('error')
          complete = jasmine.createSpy('complete')
          const op = withEventHandlerProps('event')
          const src$ = new Subject()
          const sub = op(src$).subscribe(next, error, complete)
          src$.complete()
          sub.unsubscribe()
        })

        it('the output observable completes', function () {
          expect(next).not.toHaveBeenCalled()
          expect(error).not.toHaveBeenCalled()
          expect(complete).toHaveBeenCalled()
        })
      })
    })
  })

  describe('when called with a function:', function () {
    let next, project

    beforeEach(function () {
      project = jasmine.createSpy('project').and.returnValue({ baz: 'BAR' })
      next = jasmine.createSpy('next')
      const error = jasmine.createSpy('error')
      const complete = jasmine.createSpy('complete')
      const op = withEventHandlerProps(project)('baz')
      const src$ = new Subject()
      let onBaz
      next.and.callFake(function (x) {
        onBaz = x.onBaz
      })
      const sub = op(src$).subscribe(next, error, complete)
      src$.next({ foo: 'foo' })
      onBaz('bar')
      sub.unsubscribe()
    })

    it('returns a new withEventHandlerProps function, ' +
    'with its default event-to-event-prop mapper set to that function', function () {
      expect(next.calls.argsFor(0)).toEqual([{
        foo: 'foo',
        onBaz: jasmine.any(Function)
      }])
      expect(next.calls.argsFor(1)).toEqual([{
        foo: 'foo',
        onBaz: jasmine.any(Function),
        baz: 'BAR'
      }])
      expect(project).toHaveBeenCalledWith('baz', 'bar')
    })
  })

  describe('when called without arguments:', function () {
    let next

    beforeEach(function () {
      next = jasmine.createSpy('next')
      const error = jasmine.createSpy('error')
      const complete = jasmine.createSpy('complete')
      const op = withEventHandlerProps()('baz')
      const src$ = new Subject()
      let onBaz
      next.and.callFake(function (x) {
        onBaz = x.onBaz
      })
      const sub = op(src$).subscribe(next, error, complete)
      src$.next({ foo: 'foo' })
      onBaz('bar')
      sub.unsubscribe()
    })

    it('returns a new withEventHandlerProps function, ' +
    'with the default event-to-event-prop mapper', function () {
      expect(next.calls.argsFor(0)).toEqual([{
        foo: 'foo',
        onBaz: jasmine.any(Function)
      }])
      expect(next.calls.argsFor(1)).toEqual([{
        foo: 'foo',
        onBaz: jasmine.any(Function),
        event: { id: 'baz', payload: 'bar' }
      }])
    })
  })
})
