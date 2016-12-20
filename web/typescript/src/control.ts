/// <reference path="../typings/index.d.ts" />
import { GameGrid, BlockItem, mapToWorld, BlockSprite, BlockType, BlockMap, bound, GameModel } from './model';
import { GameView } from './view'
import { GameWidth, GameHeight, sounds, BlockSize } from './config';
import { Statu } from './message_struct';

function checkValid(sprite: BlockItem, position: Phaser.Point, grid: GameGrid): boolean {
    let rect = bound(sprite, position);
    if (rect.x < 0 ||
        rect.x + rect.width > grid.width ||
        rect.y + rect.height > grid.height)
        return false;

    let pts = mapToWorld(sprite, position);
    for (let pt of pts) {
        if (0 <= pt.y && grid.map[pt.y][pt.x])
            return false;
    }
    return true;
}


export
class Control {
    sound: any = {};

    private random = new Phaser.RandomDataGenerator();
    
    private rate = 500;
    private lastTime = 0;

    constructor(public game: Phaser.Game, public model: GameModel, public view: GameView) {
        this.sound.press = this.game.add.audio('press');
        this.sound.explod = this.game.add.audio('explod');
        this.sound.congratulation = this.game.add.audio('congratulation');

        this.addEventListener();
    }

    restart = () => {
        this.model.reset();
    }

    update = ()=> {
        if (this.model.status != Statu.run) {
            return;
        }

        if (!this.model.sprite) {
            this.model.sprite = this.createSprite();
        }

        if (this.rate + this.lastTime <= this.game.time.now) {
            this.lastTime = this.game.time.now;

            if (!Control.move(this.model.sprite, new Phaser.Point(0, 1), this.model.grid)) {
                this.fallGround();
            }
        }

        if (this.view) {
            this.view.refresh();
        }
    }

    render = () => {
        if (this.model.sprite) {
            this.view.refresh();
        }
    }

    createSprite = (): BlockSprite => {
        let type = this.random.integerInRange(0, BlockType.cnt - 1);
        let state = this.random.integerInRange(0, BlockMap[type].length - 1);
        let shape = BlockMap[type][state];

        let height = shape.length;
        let width = shape[0].length;

        let position = new Phaser.Point((GameWidth - width)>>1 , -height);
        let sprite =  new BlockSprite(type, state, position);
        return sprite;
    }

    static updateGrid(grid: GameGrid, sprite: BlockSprite) {
        let pts = mapToWorld(sprite, sprite.position);
        for (let pt of pts) {
            if (pt.y >= 0) {
                grid.map[pt.y][pt.x] = 1;
            }
        }
    }


    static move(sprite :BlockSprite, offset: Phaser.Point, grid: GameGrid): boolean {
        let position = sprite.position.clone().add(offset.x, offset.y);
        if (checkValid(sprite, position, grid)) {
            sprite.position = position;
            return true;
        }
        return false;
    }

    changeSpriteState = () => {
        let newVal = this.model.sprite.change();
        if (checkValid(newVal, newVal.position, this.model.grid)) {
            this.model.sprite = newVal;
            return true;
        }
        return false;
    }

    addEventListener = () => {
        //this.game
        let keys = this.game.input.keyboard.addKeys( { 'down': Phaser.KeyCode.DOWN, 'left': Phaser.KeyCode.LEFT, 'right': Phaser.KeyCode.RIGHT, 'up':  Phaser.KeyCode.UP, 'change': Phaser.KeyCode.SPACEBAR } );

        let moveWrap = (offset: Phaser.Point) => { return ()=>{ Control.move(this.model.sprite, offset, this.model.grid)} };
        let holdKey = (key: Phaser.Key, nInterval: number, func:()=>void) => {
            let base = 0;
            key.onDown.add(()=> {base = 0;});
            key.onHoldCallback = ()=> { 
                if (this.model.status != Statu.run) {
                    return;
                }

                let cnt = this.game.time.time - base;
                if (cnt > nInterval ) {
                    this.sound.press.play();
                    func();
                    base = this.game.time.time;
                }
            };
        }

        let change = () => { this.changeSpriteState(); };

        //keys.down.onDown.add(moveWrap(new Phaser.Point(0, 1)));
        //keys.left.onDown.add( moveWrap(new Phaser.Point(-1, 0)));
        //keys.right.onDown.add( moveWrap(new Phaser.Point(1, 0)));
        //keys.up.onDown.add(change);
        //keys.change.onDown.add(change)

        holdKey(keys.down, 30, moveWrap(new Phaser.Point(0, 1)));
        holdKey(keys.left, 150, moveWrap(new Phaser.Point(-1, 0)));
        holdKey(keys.right, 150, moveWrap(new Phaser.Point(1, 0)));
        holdKey(keys.up, 150, change);
        holdKey(keys.change, 150, change);
    }

    private score(lines: number[]) {
        this.model.grid.deleteLines(lines);
        this.sound.explod.play();

        this.model.score += this.calcScore(lines);
    }

    private calcScore(lines: number[]): number {
        // linse must be sorted
        const unit = 50;
        let val = unit * lines.length;
        let cnt = 0;
        for (let i = 1; i < lines.length; i++) {
            if (Math.abs(lines[i] - lines[i-1]) == 1) {
                cnt++;
                val += unit * cnt;
            } else {
                cnt = 0;
            }
        }
        return val;
    }

    private fallGround() {
        Control.updateGrid(this.model.grid, this.model.sprite);
        let rect = bound(this.model.sprite, this.model.sprite.position);
        let lines = this.model.grid.checkLineComplete(this.model.grid, rect.y, rect.y + rect.height - 1);
        if (lines.length > 0) {
            this.score(lines);
        }

        if (rect.y < 0) {
            this.model.status = Statu.end;
        }
        this.model.sprite = this.createSprite();
    }
}

export
class ShadowControl {
    constructor(game: Phaser.Game, private model: GameModel, private view: GameView) {
    }

    update = ()=> {
        this.view.refresh();
    }
    
    render = ()=> {
        this.view.refresh();
    }
}
