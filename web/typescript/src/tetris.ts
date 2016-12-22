import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { GameModel, BlockSprite, Rect, BlockItem } from './model';
import { GameView } from './view';
import { GameWidth, GameHeight, sounds } from './config';
import { Control, InformationBar } from './control';
import { WebService } from './web_service';

import { ServerMessage, ServerCommand, Statu, GameData, ClientCommand } from './message_struct';

export
interface ISprite {
    update: () => void;
    draw?: () => void;
}

function changeGuard<T>(obj: any, key: string, initVal: T, func: ()=>void) {
    let preview = initVal;
    if (obj[key] != preview) {
        func();
    }
    preview = obj[key];
}

class ScoreSprite implements ISprite{
    private text: Phaser.Text;
    private readonly model: GameModel;

    constructor(game: Phaser.Game, private title: string, model: GameModel, x: number, y: number, style: any) {
        this.model = model;
        this.text = game.add.text(x, y, '', style);
    }

    update = () => { changeGuard(this.model, 'score', -1, this.updateText); }

    draw = () => {}

    private updateText= () => {
        let str = String(this.model.score);
        this.text.setText(this.title + ': ' + str);
    }
}

export
class Tetris {
    self: GameModel;
    opponent: GameModel;

    nextBlocks: BlockItem[] = [];    // should in model

    private animaFrameId: number;
    private intervalId: NodeJS.Timer;
    private net: TetrisNet;
    private children: ISprite[] = [];
    constructor() {
        document.body.oncontextmenu = function () { return false; };

        //this.nextBlocks.length = 3; // inital to undefined

        // self
        this.self = new GameModel(GameWidth, GameHeight);
        // opponent
        this.opponent = new GameModel( GameWidth, GameHeight);

        this.loop();
        this.net = new TetrisNet(this);

        this.net.listen();
    }

    update = () => {
        for (let child of this.children) {
            child.update();
        }
    }

    render = () => {
        for (let child of this.children) {
            if (child.draw){
                child.draw();
            }
        }
    }

    private loop = () => {
        let requestAnimationFram = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
        let _loopRender = () => {
            this.render();
            this.update();
            this.animaFrameId = requestAnimationFram(_loopRender);
        };
        _loopRender();
        //this.intervalId = setInterval(this.update, 16);
    }

    dispose = () => {
        let cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame;
        cancelAnimationFrame(this.animaFrameId);

        clearInterval(this.intervalId);
    }

    start = () => {
        this.self.status = Statu.start;
        this.net.ws.send({ code: ClientCommand.start });
    }

    pause = () => {
        this.self.status = Statu.pause;
        this.net.ws.send({ code: ClientCommand.pause });
    }

    addChild = (s: ISprite) => {
        this.children.push(s);
    }

    deleteChild = (s: ISprite): boolean => {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i] == s) {
                this.children.splice(i, 1);
                return true;
            }
        }
        return false;
    }
}

class TetrisNet {
    ws: WebService;
    private subject: Subscription;
    private intervalId: NodeJS.Timer;
    constructor(private instance: Tetris) {
        let index = window.location.pathname.lastIndexOf('/');
        let room = window.location.pathname.substr(index + 1);
        let host = window.location.host
        this.ws = new WebService('ws://' + host + '/ws/tetris/' + room);
    }

    listen = () => {
        this.ws.connect();

        this.subject = this.ws.message.map((data) => {
            let json = JSON.parse(data);
            return <ServerMessage>json;
        })
            .catch((err) => {
                console.log(err);
                return null;
            })
            .subscribe(this.onMessage);

        this.intervalId = setInterval(this.sampling, 250);
    }

    stop = () => {
        clearInterval(this.intervalId);
        this.ws.close();
        this.subject.unsubscribe();
    }

    private onMessage = (message: ServerMessage) => {
        if (!message) {
            return;
        }

        switch (message.code) {
            case ServerCommand.start:
                this.instance.self.status = Statu.run;
                break;
            case ServerCommand.pause:
                this.instance.self.status = Statu.pause;
                break;
            case ServerCommand.update:
                if (message.self) {
                    this.instance.self.updateFromJson(message.self);
                }
                if (message.other) {
                    this.instance.opponent.updateFromJson(message.other);
                }
                break;
        }
    }

    private sampling =
        (() => {
            let __last_status = -1;
            return () => {
                if (this.instance.self.status == Statu.run || this.instance.self.status != __last_status) {
                    let data = this.instance.self.toJson();
                    this.ws.send({ code: ClientCommand.update, data: data }, false);
                }
                __last_status = this.instance.self.status;
            };
        })();
}