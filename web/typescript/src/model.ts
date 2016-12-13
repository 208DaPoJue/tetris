type Shape = number[][];

/*
长条形 i
 */

const IBlock = [
    [[1, 1, 1, 1]],
    [
        [1],
        [1],
        [1],
        [1]
    ]
];

/*
 方形 O
 */
const OBlock = [
    [
        [1, 1],
        [1, 1]
    ]
];


/*
  Z形 
*/
const ZBlock = [
    [
        [1, 1, 0],
        [0, 1, 1]
    ],
    [
        [0, 1],
        [1, 1],
        [1, 0]
    ]
];
/* S形
*/
const SBlock = [
    [
        [0, 1, 1],
        [1, 1, 0]
    ],
    [
        [1, 0],
        [1, 1],
        [0, 1]
    ]
];

/* J 形*/
const JBlock = [
    [
        [1, 1, 1],
        [0, 0, 1]
    ],
    [
        [1, 1],
        [1, 0],
        [1, 0]
    ],
    [
        [1, 0, 0],
        [1, 1, 1]
    ],
    
    [
        [0, 1],
        [0, 1],
        [1, 1]
    ]
];



/*L形*/
const LBlock = [
    [
        [1, 1, 1],
        [1, 0, 0]
    ],
    [
        [1, 1],
        [0, 1],
        [0, 1]
    ],
    [
        [0, 0, 1],
        [1, 1, 1]
    ],
    [
        [1, 0],
        [1, 0],
        [1, 1]
    ]
];

/* T 形*/
const TBlock = [
    [
        [1, 1, 1],
        [0, 1, 0]
    ],
    [
        [1, 0],
        [1, 1],
        [1, 0]
    ],
    [
        [0, 1, 0],
        [1, 1, 1]
    ],
    [
        [0, 1],
        [1, 1],
        [0, 1]
    ]
];


export
const BlockMap = [IBlock, OBlock, JBlock, LBlock, SBlock, ZBlock, TBlock];

export
enum BlockType {
    bt_i,
    bt_o,
    bt_j,
    bt_l,
    bt_s,
    bt_z,
    bt_t,

    cnt
}

export
interface BlockItem {
    type: number;
    state: number;
}

export 
interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}


export
function bound(item: BlockItem, position: Phaser.Point): Rect {
    let shape = BlockMap[item.type][item.state];
    return { x: position.x, 
             y: position.y, 
             width: shape[0].length, 
             height: shape.length};
}


export
class BlockSprite implements BlockItem {
    
    private shapes: Shape[];
    constructor(public type: number, public state: number, public position: Phaser.Point) {
        this.shapes = BlockMap[type];
        this.state = state % this.shapes.length;
    }

    change(): BlockSprite {
        return new BlockSprite(this.type, this.state + 1, this.position);
    }
}


export
function mapToWorld(item: BlockItem, position: Phaser.Point): Phaser.Point[] {
    let shape = BlockMap[item.type][item.state];

    let h = shape.length;
    let w = shape[0].length;

    let res: Phaser.Point[] = [];
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            if (shape[i][j]) {
                res.push(position.clone().add(j, i));
            }
        }
    }
    return res;
}


export
class GameGrid {
    map: number[][];
    constructor(public width: number, public height: number){
        this.map = new  Array(height);
        for (let i = 0; i < height; i++){
            this.map[i] = this.newLine();
        }; 
    }

    isCompleteLine(line: number): boolean {
        console.assert(line < this.height);
        return !this.map[line].some((val) => {
            return val == 0;
        });
    }

    checkLineComplete(grid: GameGrid, from: number, to: number): number[] {
        let res: number[] = [];
        from = Math.max(0, from);
        for (let i = to; i >= from; i--){
            if (grid.isCompleteLine(i))
                res.push(i);
        }

        return res;
    }

    deleteLines(lines: number[]) {
        if (lines.length == 0) {
            return;
        }

        lines.sort((lh: number, rh: number) => {
            return rh - lh;
        });

        let arr = new Array(this.height);
        for (let line = this.height - 1, idx = 0; line >= idx;) {
            if (idx < lines.length && line - idx == lines[idx]) {
                idx++;
            } else {
                arr[line] = this.map[line - idx];
                line--;
            }
        }

        for (let i = 0; i < lines.length; i++) {
            arr[i] = this.newLine();
        }
        this.map = arr;
    }


    private newLine(): number[] {
        let arr = new Array(this.width);
        for (let i = 0; i < this.width; i++) {
            arr[i] = 0;
        }
        return arr;
    }
}