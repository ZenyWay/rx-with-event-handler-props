/**
 * @license
 * Copyright 2018 Stephane M. Catala
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * Limitations under the License.
 */
;
import { Observable } from 'rxjs/Observable'
import { merge } from 'rxjs/observable/merge'
import { Subject } from 'rxjs/Subject'
import {
  defaultIfEmpty, ignoreElements, map, share, takeUntil, withLatestFrom
} from 'rxjs/operators'

export type EventHandlerPropsOperator<E,L=EventProp<E>> =
<P>(props$: Observable<P>) => Observable<P&EventHandlerProps<E,L>>

export type EventHandlerProps<E,L> = EventHandlerProp<E> & Partial<L>

export interface EventHandlerProp<E> {
  [onId: string]: (event: E) => void
}

export interface EventProp<E,P=void> {
  event: { id: string, payload: E|P, event?: E }
}

export interface EventMapper<E,L=EventProp<E>> {
  (event: E, id?: string): L
  <P>(payload: P, event: E, id?: string): L
}

export default function withEventHandlerProps <E>(
  id: string
): EventHandlerPropsOperator<E>
export default function withEventHandlerProps <E>(
  /* project = toEventProp */
): (id: string) => EventHandlerPropsOperator<E>
export default function withEventHandlerProps <E,L=EventProp<E>>(
  project: EventMapper<E,L>
): (id: string) => EventHandlerPropsOperator<E,L>
export default function withEventHandlerProps <E,L=EventProp<E>>(
  project: string|EventMapper<E,L> = <EventMapper<E,any>>toEventProp
) {
  return !isFunction(project)
  ? withEventHandlerProps<E>()(project)
  : function (id: string) {
    const key = toHandlerKey(id)

    return function <P>(props$: Observable<P>) {
      const _props$ = props$.pipe(share())
      const event$ = new Subject<L|EventProp<E>>()
      ;(<any>handler).__eventId = id // for identification with hasEventHandler

      return merge(
        _props$,
        event$.pipe(
          withLatestFrom<L|EventProp<E>,P,P&(L|EventProp<E>)>(_props$, shallowMerge)
        )
      ).pipe(
        map(withHandler),
        takeUntil(_props$.pipe(ignoreElements(), defaultIfEmpty()))
      )

      function withHandler <Q>(props: Q): Q&EventHandlerProp<E> {
        return { ...(props as any), [key]: handler }
      }

      function handler (payload: E): void
      function handler <P>(payload: P, event: E): void
      function handler (payload: any, event?: any): void {
        event$.next(
          arguments.length > 1
          ? (<EventMapper<E,any>>project)(payload, event, id)
          : (<EventMapper<E,any>>project)(payload, id)
        )
      }
    }
  }
}

export function hasEventHandler (id: string) {
  const k = toHandlerKey(id)
  return function (p: any): boolean {
    const fn = p && p[k]
    return (fn && fn.__eventId) === id
  }
}

export function hasEvent (id: string) {
  return function (p: any) {
    return (p && p.event && p.event.id) === id
  }
}

function toEventProp <E>(payload: E, id: string): EventProp<E>
function toEventProp <E,P>(payload: P, event: E, id: string): EventProp<E,P>
function toEventProp (payload: any, idOrEvent: any, id?: string): EventProp<any,any> {
  return arguments.length === 3
    ? { event: { id, payload, event: idOrEvent } }
    : { event: { id: idOrEvent, payload } }
}

function toHandlerKey (id: string): string {
  return `on${capitalize(id)}`
}

function capitalize (str: string): string {
  return str[0].toUpperCase() + str.slice(1).toLowerCase()
}

function shallowMerge (event: any, props: any) {
  return { ...event, ...props }
}

function isFunction (v: any): v is Function {
  return typeof v === 'function'
}
