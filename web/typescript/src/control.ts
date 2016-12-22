/// <reference path="../typings/index.d.ts" />
import { GameGrid, BlockItem, mapToWorld, BlockSprite, BlockType, BlockMap, bound, GameModel } from './model';
import { GameView, PreviewView, IView } from './view';
import { GameWidth, GameHeight, sounds } from './config';
import { Statu } from './message_struct';
import { Tetris } from './tetris';

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
    private views: IView[] = [];
    private game: Phaser.Game;
    constructor(elem: Element, public model: GameModel, private nextBlocks: BlockItem[] ) {
        this.game = new Phaser.Game(elem.clientWidth, elem.clientHeight, Phaser.CANVAS, elem, { preload: this.preload, create: this.create });
    }

    create = () => {
        Phaser.Canvas.setUserSelect(this.game.canvas, 'none');
        Phaser.Canvas.setTouchAction(this.game.canvas, 'none');

        this.sound.press = this.game.add.audio('press');
        this.sound.explod = this.game.add.audio('explod');
        this.sound.congratulation = this.game.add.audio('congratulation');

        this.views.push(new GameView(this.game, this.model, this.game.width, this.game.height, 0, 0));

        for (let i = 0; i < 3;  i++){
            this.createBlock();
        }

        this.addEventListener(); 
    }
    
    preload = () => {
        this.game.stage.disableVisibilityChange = true;
        this.game.load.audio('press', sounds.press);
        this.game.load.audio('explod', sounds.explod);
        this.game.load.audio('congratulation', sounds.congratulation);
    }

    restart = () => {
        this.model.reset();
    }

    update = ()=> {
        if (this.model.status != Statu.run) {
            return;
        }

        if (!this.model.sprite) {
            this.model.sprite = this.nextSprite();
        }

        if (this.rate + this.lastTime <= this.game.time.now) {
            this.lastTime = this.game.time.now;

            if (!Control.move(this.model.sprite, new Phaser.Point(0, 1), this.model.grid)) {
                this.fallGround();
            }
        }
    }

    draw = () => {
        for (let view of this.views) {
            view.refresh();
        }
    }

    createBlock = () => {
        let type = this.random.integerInRange(0, BlockType.cnt - 1);
        let state = this.random.integerInRange(0, BlockMap[type].length - 1);
        
        this.nextBlocks.push({type: type, state: state});
    }

    nextSprite = (): BlockSprite => {
        this.createBlock();

        let block = this.nextBlocks[0];
        let shape = BlockMap[block.type][block.state];
        this.nextBlocks.splice(0, 1);

        let height = shape.length;
        let width = shape[0].length;

        let position = new Phaser.Point((GameWidth - width)>>1 , -height);
        let sprite =  new BlockSprite(block.type, block.state, position);
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
        this.model.sprite = this.nextSprite();
    }
}

export
class InformationBar {
    private game: Phaser.Game;
    private views: IView[] = [];
    constructor(elem: Element, private tetrie: Tetris) {
        this.game = new Phaser.Game(elem.clientWidth, elem.clientHeight, Phaser.CANVAS, elem, { preload: this.preload, create: this.create });
    }

    create = () => {
        Phaser.Canvas.setUserSelect(this.game.canvas, 'none');
        Phaser.Canvas.setTouchAction(this.game.canvas, 'none');

        let offset = 0;
        let preview = new PreviewView(this.game, this.tetrie.nextBlocks, this.game.width, this.game.height, 0, 0);
        this.views.push(preview);

        offset += preview.getBound().height;
        let view = new GameView(this.game, this.tetrie.opponent, this.game.width, this.game.height - offset, 0, offset);
        this.views.push(view);
    }
    
    preload = () => {
    }

    update = ()=> {
    }
    
    draw = ()=> {
        for (let view of this.views) {
            view.refresh();
        }
    }
}
