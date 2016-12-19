import { Control } from './control';
import { mapToWorld, GameModel } from './model';
import { BlockSize, GameWidth, GameHeight } from './config';

export
class GameView {
    private view: Phaser.BitmapData;
    private readonly model: GameModel;
    constructor(game: Phaser.Game, model: GameModel, x: number, y: number) {
         this.view = game.make.bitmapData(model.blockSize * model.width, model.blockSize * model.height);
         this.model = model;
         this.view.addToWorld(x, y);
    }

    refresh = ()=> {
        //  Update both the Canvas and Preview
        this.view.clear();
        //
        try {
            this.drawGrid();
            this.drawSprite();
        }
        catch (e) {
            console.log(e);
        }
        
    }

    drawGrid =() => {
        for (var y = 0; y < GameHeight; y++) {
            for (var x = 0; x < GameWidth; x++) {
                if (this.model.grid.map[y][x] > 0) {
                    this.drawBlock(x, y);
                } else {
                    this.clearBlock(x, y);
                }
            }
        }
    }

    drawSprite = ()=> {
        if (!this.model.sprite) {
            return;
        }

        let pts = mapToWorld(this.model.sprite, this.model.sprite.position);
        for (let pt of pts) {
            this.drawBlock(pt.x, pt.y);
        }
    }

    private drawBlock = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= this.model.width || y >= this.model.height) {
                return;
        }
        let blockSize = this.model.blockSize;
        this.view.rect(x * blockSize, y * blockSize, blockSize, blockSize, '#000');
        this.view.rect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2, '#aaa');
    }

    private clearBlock = (x: number, y: number) => {
        let blockSize = this.model.blockSize;
        this.view.rect(x * blockSize, y * blockSize, blockSize, blockSize, '#3f5c67');
    }
}