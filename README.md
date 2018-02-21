# rx-with-event-handler-props
[![NPM](https://nodei.co/npm/rx-with-event-handler-props.png?compact=true)](https://nodei.co/npm/rx-with-event-handler-props/)

rxjs-based component behaviour (reactive props stream operator)
for lifting a [component-from-stream](https://npmjs.com/package/component-from-stream/)
that adds an event-handler property and injects an event property
when that handler is called with a payload.

# API
for a detailed specification of this API,
run the [unit tests](https://cdn.rawgit.com/ZenyWay/rx-with-event-handler-props/v1.1.2/spec/web/index.html)
in your browser.

## example usage
```tsx
const behaviour = compose(
  // ... behaviours that may depend on the injected { id: 'click' } EventProp
  withEventHandler('click'),
  // ... other behaviours that do not require access to the EventHandlerProps
)
// SFC that uses the handler from the EventHandlerProp
const Clickable = ({ onClick /*, other props */ }) => (
  <div onClick={onClick}>
  <!-- ... -->
  </div>
)
// ...
export componentFromStream(Clickable, behaviour)
```

by default, when the handler from the `EventHanderProp` is called,
its payload is mapped to an `EventProp` property on the object emitted
by the output stream.
alternatively, `withEventHandler` may be called
with a custom event-to-event-prop mapping function
that maps the handler's payload to a custom property on the output object.
this may be used for example to generate an 'action' property instead:
```tsx
const createAction = type => payload => ({ action: { type, payload } })
const behaviour = compose(
  // ... behaviours that handle the 'action' property, e.g. with reducers
  withEventHandler(createAction('INCREMENT'))('click')
  // ...
)
// ...
```

## type definitions
```ts
declare function withEventHandlerProps <E>(
	id: string
): <P>(props$: Observable<P>) => Observable<P&EventHandlerProps<E>>
declare function withEventHandlerProps <E>(
	/* project = toEventProp */
): (id: string) => <P>(props$: Observable<P>) => Observable<P&EventHandlerProps<E>>
declare function withEventHandlerProps <E,L>(
	project: (id: string, payload: E) => L
): (id: string) => <P>(props$: Observable<P>) => Observable<P&L&EventHandlerProp<E>>

type EventHandlerProps<E,L> = EventHandlerProp<E> & Partial<EventProp<L>>

type EventHandlerProps<E> = EventHandlerProp<E> & Partial<EventProp<E>>

interface EventHandlerProp<E> {
  [onEventType: string]: (event: E) => void
}

interface EventProp<E> {
	event: { id: string, payload: E }
}
```

# TypeScript
although this library is written in [TypeScript](https://www.typescriptlang.org),
it may also be imported into plain JavaScript code:
modern code editors will still benefit from the available type definition,
e.g. for helpful code completion.

# License
Copyright 2018 Stéphane M. Catala

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the [License](./LICENSE) for the specific language governing permissions and
Limitations under the License.
