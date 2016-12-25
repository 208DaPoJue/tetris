import * as React from 'react';
import { findDOMNode, render } from 'react-dom';
import { Tetris } from '../src/tetris';
import { Control } from '../src/control';


enum Dir {
    none = 0,
    up = 1,
    down = 2,
    left = 3,
    right = 4
}
interface game {
    getControl: ()=>(Control);
}
interface Props {tetris: Tetris, game: game, style?: any}
export 
class Controler extends React.Component<Props, undefined> {
    private isTouchDown = false;
    private direction: Dir = Dir.none;
    private offsetX: number;
    private offsetY: number;
    private width: number = 1;
    private height: number = 1;

    private firstDelay = 300;
    private holdDelay = 150;
    private delay = 0;
    private timeStamp = 0;

    componentDidMount() {
        let el = findDOMNode(this);
        this.width = el.clientWidth;
        this.height = el.clientHeight;

        this.props.tetris.addChild(this);
    }

    update = () => {
        if (this.direction == Dir.none) {
            return;
        }

        if (this.timeStamp + this.delay < Date.now()) {
            this.fire(this.direction);
            this.timeStamp= Date.now();
            this.delay = this.holdDelay;
        }
    }

     //触屏开始
    onTouchStart = (e: any) =>{
        e.preventDefault();
        e.stopPropagation();
        if(this.isTouchDown){
            return ;
        }
        this.isTouchDown = true;
       
        this.updatePosition(e);
        this.setDirection(this.calc());
        this.fire(this.direction);        
    };

    //触屏滑动
    onTouchMove = (e: any) =>{
        e.preventDefault();
        e.stopPropagation();
        if(!this.isTouchDown){
            return;
        }
        this.updatePosition(e);

        let dir = this.calc();
        if (dir != this.direction) {
            this.setDirection(dir);
        }
    };
    //触屏结束
    onTouchEnd = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        this.isTouchDown = false;
        this.setDirection(Dir.none);
    };

    calc = (): Dir => {
        let vec =  {x: this.offsetX, y: this.height- this.offsetY};
        let center = { x: this.width / 2, y: this.height /2 };

        let k = center.y / center.x;
        let leftTop = vec.y  >  vec.x * k;
        let leftBottom = this.height - vec.x * k > vec.y;
        if (leftTop && leftBottom)
            return Dir.left;
        if (leftTop && !leftBottom)
            return Dir.up;
        if (!leftTop && leftBottom)
            return Dir.down;
        if (!leftTop && !leftBottom)
            return Dir.right;
        return Dir.none;
    };


    fire = (dir: Dir) => {
        switch( dir ) {
            case Dir.left: this.props.game.getControl().left();
                break;
            case Dir.right: this.props.game.getControl().right();
                break;
            case Dir.down: this.props.game.getControl().down();
                break;
            case Dir.up: this.props.game.getControl().change();
                break;
        }
    }

    setDirection(dir: Dir) {
        this.direction = dir;
        this.timeStamp = Date.now();
        this.delay = this.firstDelay;
    }
    

    render() {
        let style = {
            background: 'url("../static/assets/images/dpad.png")',
            width: "235px",
            height: "235px",
            position: 'absolute',
            bottom: '45px',
            left: '45px'
            }
        return <div style={style} onTouchStart={this.onTouchStart} onTouchMove={this.onTouchMove} onTouchEnd={this.onTouchEnd}></div>
    }

    updatePosition(e: any) {
        var event= e || window.event;
        var srcObj = e.target || e.srcElement;
        let touch = event.touches[0];
        this.offsetX = touch.offsetX || (touch.clientX - srcObj.getBoundingClientRect().left);
        this.offsetY  = touch.offsetY || (touch.clientY - srcObj.getBoundingClientRect().top);
    }

}