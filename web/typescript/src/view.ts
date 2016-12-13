import { Control } from './control';
import { mapToWorld } from './model';
import { BlockSize, GameWidth, GameHeight } from './config';

export
class GameView {
    private view: Phaser.BitmapData;
    constructor(private ctrl: Control) {
         this.view = ctrl.game.make.bitmapData(BlockSize * GameWidth, BlockSize * GameHeight);
         this.view.addToWorld(32, 32);
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
                if (this.ctrl.grid.map[y][x] > 0) {
                    this.view.rect(x * BlockSize, y * BlockSize, BlockSize, BlockSize, '#000');
                    this.view.rect(x * BlockSize + 1, y * BlockSize + 1, BlockSize - 2, BlockSize - 2, '#aaa');
                } else {
                    this.view.rect(x * BlockSize, y * BlockSize, BlockSize, BlockSize, '#3f5c67');
                }
            }
        }
    }

    drawSprite = ()=> {
        if (!this.ctrl.sprite) {
            return;
        }

        let pts = mapToWorld(this.ctrl.sprite, this.ctrl.sprite.position);
        for (let pt of pts) {
            if (pt.x < 0 || pt.y < 0 || pt.x >= GameWidth || pt.y >= GameHeight) {
                continue;
            }
            
            this.view.rect(pt.x * BlockSize, pt.y * BlockSize, BlockSize, BlockSize, '#000');
            this.view.rect(pt.x * BlockSize + 1, pt.y * BlockSize + 1, BlockSize - 2, BlockSize - 2, '#aaa');
        }
    }
}