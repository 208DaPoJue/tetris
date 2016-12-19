import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ClientMessage } from './message_struct';

interface stateChange {
    state: number;
    openEvent ?: Event;
    closeEvent ?: CloseEvent;
}

export
class WebService {
    private ws: WebSocket
    private _state: number = WebSocket.CONNECTING;
    state: BehaviorSubject<stateChange>;
    message: Subject<any>;

    constructor(private url:string, private protocols:string[] = []) {
        this.url = url;
        this.protocols = protocols;
        
        this.state = new BehaviorSubject<stateChange>({state: this._state});
        this.message = new Subject<any>();
    }

    connect() {
        if (this._state != WebSocket.CLOSED) {
            this.close();
        }
        
        this.ws = new WebSocket(this.url, this.protocols);
        this.ws.onopen = this.onopen;
        this.ws.onclose = this.onclose;
        this.ws.onmessage = this.onmessage;
        this.ws.onerror = this.onerror;

        if (this._state != WebSocket.CONNECTING) {
            this._state = WebSocket.CONNECTING;
            this.state = new BehaviorSubject<stateChange>({state: this._state});
        }
    }

    send = (data: ClientMessage, force: boolean = true): boolean =>{
        if (this._state != WebSocket.OPEN) {
            return false;
        }

        if (!force && this.ws.bufferedAmount > 0) {
            return false;
        }

        let json = JSON.stringify(data);
        this.ws.send(json);
        return true;
    }

    close = (code ?: number, reason ?: string) => {
        if (this.ws) {
            this.ws.close(code, reason);
        }
    }

    private onopen = (event:Event) => {
        this._state = WebSocket.OPEN;
        this.state.next({state:this._state, openEvent: event });
    };


    private onclose = (event:CloseEvent) => {
        this._state = WebSocket.CLOSED;
        this.state.next( <stateChange>{state: this._state, closeEvent: event });
    };

    private onmessage = (event: MessageEvent) => {
        this.message.next(event.data);
    }

    private onerror = (event: any) => {
        this.log('onerror', event);
    };

    private log(...args: any[]) {
        console.debug.apply(console, args);
    }
}