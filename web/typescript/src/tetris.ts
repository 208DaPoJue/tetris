import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { GameModel, BlockSprite } from './model';
import { GameView } from './view';
import { GameWidth, GameHeight, BlockSize, sounds } from './config';
import { Control, ShadowControl } from './control';
import { WebService } from './web_service';

import { ServerMessage, ServerCommand, Statu, GameData, ClientCommand } from './message_struct';

interface ISprite {
    update: () => void;
    render: () => void;
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

    render = () => {}

    private updateText= () => {
        let str = String(this.model.score);
        this.text.setText(this.title + ': ' + str);
    }
}



class Tetris {
    game: Phaser.Game;
    self: GameModel;
    opponent: GameModel;

    private net: TetrisNet;
    private children: ISprite[] = [];
    constructor(id: string) {
        let elem = document.getElementById(id);
        this.game = new Phaser.Game(elem.clientHeight, elem.clientWidth, Phaser.CANVAS, id, { preload: this.preload, create: this.create, update: this.update, render: this.render });

    }

    private init() {
        // self
        this.self = new GameModel(this.game, GameWidth, GameHeight, BlockSize);
        let view = new GameView(this.game, this.self, 32, 32);
        let control = new Control(this.game, this.self, view);
        this.children.push(control);

        // opponent
        this.opponent = new GameModel(this.game, GameWidth, GameHeight, BlockSize / 4);
        view = new GameView(this.game, this.opponent, 480, 240);
        let shadow = new ShadowControl(this.game, this.opponent, view);
        this.children.push(shadow);


        let style = {font: '25px Arial', fill: '#ffffff', align: 'left', fontWeight: 'bold', stroke: '#000000', strokeThickness: 6};
        this.children.push(new ScoreSprite(this.game, '我的得分', this.self, 20, 700, style));
        this.children.push(new ScoreSprite(this.game, '对手得分', this.opponent, 20, 740, style));

        this.net = new TetrisNet(this);
    }

    preload = () => {
        this.game.load.audio('press', sounds.press);
        this.game.load.audio('explod', sounds.explod);
        this.game.load.audio('congratulation', sounds.congratulation);

        // tmp
        this.game.load.spritesheet('buttons', '../static/assets/images/buttons.png', 215, 41);
    }

    create = () => {
        document.body.oncontextmenu = function () { return false; };

        Phaser.Canvas.setUserSelect(this.game.canvas, 'none');
        Phaser.Canvas.setTouchAction(this.game.canvas, 'none');

        let btn = this.game.add.button(400, 80, 'buttons', () => {//添加一个按钮
            if (this.self.status == Statu.waitting || this.self.status == Statu.pause) {
                this.self.status = Statu.start;
                this.net.start();
            }
        });

        this.init();

        this.net.listen();
    }

    update = () => {
        for (let child of this.children) {
            child.update();
        }
    }

    render = () => {
        for (let child of this.children) {
            child.render();
        }
    }
}

window.onload = () => {
    let instance = new Tetris('content');
};


export
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

    start = () => {
        this.ws.send({ code: ClientCommand.start });
    }

    pause = () => {
        this.ws.send({ code: ClientCommand.pause });
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