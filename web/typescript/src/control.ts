/// <reference path="../typings/index.d.ts" />
import { GameGrid, BlockItem, mapToWorld, BlockSprite, BlockType, BlockMap, bound } from './model';
import { GameView } from './view'
import { GameWidth, GameHeight, sounds } from './config';


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
    grid: GameGrid;
    sprite: BlockSprite;
    game: Phaser.Game;
    sound: any = {};
    private random = new Phaser.RandomDataGenerator();
    private view: GameView;
    
    private rate = 500;
    private lastTime = 0;
    constructor(){
        this.game = new Phaser.Game(800, 600, Phaser.CANVAS, 'content', {preload: this.preload, update: this.update, create: this.create, render: this.render});
    }

    restart = () => {
        this.grid = new GameGrid(GameWidth, GameHeight);
        this.sprite = null;
    }

    create = () => {
        
        document.body.oncontextmenu = function() { return false; };

        Phaser.Canvas.setUserSelect(this.game.canvas, 'none');
        Phaser.Canvas.setTouchAction(this.game.canvas, 'none');

        this.sound.press = this.game.add.audio('press');
        this.sound.explod = this.game.add.audio('explod');
        this.sound.congratulation = this.game.add.audio('congratulation');

        this.view = new GameView(this);
        this.addEventListener();
        this.restart();
    }

    preload = () => {
        this.game.load.audio('press', sounds.press);
        this.game.load.audio('explod', sounds.explod);
        this.game.load.audio('congratulation', sounds.congratulation);
    }

    update = ()=> {
        if (!this.sprite) {
            this.sprite = this.createSprite();
        }

        if (this.rate + this.lastTime <= this.game.time.now) {
            console.log("update");
            this.lastTime = this.game.time.now;

            if (!Control.move(this.sprite, new Phaser.Point(0, 1), this.grid)) {
                Control.updateGrid(this.grid, this.sprite);
                let rect = bound(this.sprite, this.sprite.position);
                let lines = this.grid.checkLineComplete(this.grid, rect.y, rect.y + rect.height - 1);
                if (lines.length > 0) {
                    this.grid.deleteLines(lines);
                    this.sound.explod.play();
                }

                if (rect.y < 0) {
                    this.restart();
                }
                this.sprite = this.createSprite();
            }
        }

        if (this.view) {
            this.view.refresh();
        }
        
    }

    render = () => {
        if (this.sprite) {
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
        let newVal = this.sprite.change();
        if (checkValid(newVal, newVal.position, this.grid)) {
            this.sprite = newVal;
            return true;
        }
        return false;
    }

    addEventListener = () => {
        //this.game
        let keys = this.game.input.keyboard.addKeys( { 'down': Phaser.KeyCode.DOWN, 'left': Phaser.KeyCode.LEFT, 'right': Phaser.KeyCode.RIGHT, 'up':  Phaser.KeyCode.UP, 'change': Phaser.KeyCode.SPACEBAR } );

        let moveWrap = (offset: Phaser.Point) => { return ()=>{ Control.move(this.sprite, offset, this.grid)} };
        let holdKey = (key: Phaser.Key, nInterval: number, func:()=>void) => {
            
            let base = 0;
            key.onDown.add(()=> {base = 0;});
            key.onHoldCallback = ()=> { 
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
}

window.onload = () => {
    var game = new Control();
};
