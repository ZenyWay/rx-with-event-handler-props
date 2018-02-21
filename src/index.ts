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

export type EventHandlerProps<E> = EventHandlerProp<E> & Partial<EventProp<E>>

export interface EventHandlerProp<E> {
  [onEventType: string]: (event: E) => void
}

export interface EventProp<E> {
	event: { id: string, payload: E }
}

export default function withEventHandlerProps <E>(
	id: string
): <P>(props$: Observable<P>) => Observable<P&EventHandlerProps<E>>
export default function withEventHandlerProps <E>(
	/* project = toEventProp */
): (id: string) => <P>(props$: Observable<P>) => Observable<P&EventHandlerProps<E>>
export default function withEventHandlerProps <E,L>(
	project: (id: string, payload: E) => L
): (id: string) => <P>(props$: Observable<P>) => Observable<P&L&EventHandlerProp<E>>
export default function withEventHandlerProps <E,L=EventProp<E>>(
	project: string|((payload: E, id?: string) => L|EventProp<E>) = toEventProp
) {
	return typeof project !== 'function'
	? withEventHandlerProps<E>()(project)
	: function (id: string) {
		const handlerKey = `on${capitalize(id)}`

		return function <P>(props$: Observable<P>) {
			const _props$ = props$.pipe(share())
			const event$ = new Subject<L|EventProp<E>>()

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
				return { ...(props as any), [handlerKey]: handler }
			}

			function handler (payload: E) {
				event$.next((<(pl: E, id: string) => EventProp<E>>project)(payload, id))
			}
		}
	}
}

function toEventProp <E>(payload: E, id: string) {
	return { event: { id, payload } }
}

function capitalize (str: string): string {
	return str[0].toUpperCase() + str.slice(1).toLowerCase()
}

function shallowMerge (event: any, props: any) {
	return { ...event, ...props }
}
