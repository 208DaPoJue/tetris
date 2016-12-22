import { Control } from './control';
import { mapToWorld, GameModel, BlockItem, bound, GameGrid, BlockSprite, Rect } from './model';
import { GameWidth, GameHeight } from './config';

export
interface IView {
    refresh: ()=>void;
}

class BlockView {
    private view: Phaser.BitmapData;
    private cache: GameGrid;
    constructor(game: Phaser.Game, private width: number, private height: number, private left: number, private top: number, private blockSize: number){
        this.view = game.make.bitmapData(blockSize * width, blockSize * height);
        this.view.addToWorld(left, top);

        this.cache = new GameGrid(width, height, -1);
    }
    drawBlock = (x: number, y: number, force: boolean = false) => {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        
        if (this.cache.map[y][x] == 1 && !force) {
            return;
        }
        this.cache.map[y][x] = 1;

        let blockSize = this.blockSize;
        this.view.rect(x * blockSize, y * blockSize, blockSize, blockSize, '#000');
        this.view.rect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2, '#aaa');
    }

    clearBlock = (x: number, y: number, force: boolean = false) => {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        if (this.cache.map[y][x] == 0 && !force) {
            return;
        }
        this.cache.map[y][x] = 0;
        let blockSize = this.blockSize;
        this.view.rect(x * blockSize, y * blockSize, blockSize, blockSize, '#3f5c67');
    }

    clear = () => {
        this.view.clear();
        this.cache = new GameGrid(this.width, this.height, -1);
    }
}

export
class GameView {
    private view: BlockView;
    private blockSize: number;
    private paddingX: number;
    constructor(
            game: Phaser.Game, 
            private readonly model: GameModel, 
            width: number, 
            height: number, 
            private left: number, 
            private top: number) {
        this.blockSize = Math.floor(Math.min(width / model.width, height / model.height));
        this.paddingX = (width - this.blockSize * model.width) >> 1;
        this.view = new BlockView(game, model.width, model.height, this.paddingX + left, top, this.blockSize);
    }

    getBound(): Rect {
        return {
            x: this.paddingX + this.left, 
            y: this.top, 
            width: this.blockSize * this.model.width, 
            height: this.blockSize * this.model.height};
    }

    refresh = () => {
        //  Update both the Canvas and Preview
        // this.view.clear();
        //
        try {
            this.drawGrid();
            this.drawSprite();
        }
        catch (e) {
            console.log(e);
        }

    }

    drawGrid = () => {
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                if (this.model.grid.map[y][x] > 0) {
                    this.view.drawBlock(x, y);
                } else {
                    this.view.clearBlock(x, y);
                }
            }
        }
    }

    drawSprite = () => {
        if (!this.model.sprite) {
            return;
        }

        let pts = mapToWorld(this.model.sprite, this.model.sprite.position);
        for (let pt of pts) {
            this.view.drawBlock(pt.x, pt.y);
        }
    }
}


const BlockBound = 4;
export
class PreviewView {
     private blocks: BlockView[] = [];

     private blockSize = 12;
     private bound: Rect;
     constructor(private game: Phaser.Game, private nextBlocks: BlockItem[], private width: number, private height: number, x: number, y: number) {
        
        // autoCalcBlockSize
        let w = this.width * 0.8 ;
        let h = this.height * 0.1;
        this.blockSize = Math.floor(Math.min(32, Math.min(w / BlockBound, h / BlockBound)));

        let paddingX = (width - this.blockSize * BlockBound) >> 1;
        let paddingY = 12;
        let offsetY = 0;
        for (let i = 0; i < 3; i++) {
            this.blocks.push( new BlockView(game, BlockBound, BlockBound, x + paddingX, y + offsetY, this.blockSize));
            offsetY += this.blockSize * BlockBound + paddingY;
        }

        this.bound = {x: x + paddingX,
                      y: y,
                      width: this.blockSize * BlockBound,
                      height: Math.max( 0, offsetY - paddingY) };
     }

     getBound = (): Rect=>{
         return this.bound
     }

     refresh = () => {
         let len = Math.min(this.blocks.length, this.nextBlocks.length);
         for (let i = 0; i < len; i++) {
             if (this.nextBlocks[len - 1 - i]) {
                this.drawBlock(this.blocks[i], this.nextBlocks[len - 1 - i])
             }
         }
     }

     drawBlock(view: BlockView, block: BlockItem) {
        view.clear();
        let pt = new Phaser.Point(0, 0);
        let rc = bound(block, pt);

        pt = new Phaser.Point((BlockBound - rc.width) >> 1, (BlockBound - rc.height) >> 1);
        let pts = mapToWorld(block, pt);
        for (let pt of pts) {
            view.drawBlock(pt.x, pt.y);
        }
     }
}