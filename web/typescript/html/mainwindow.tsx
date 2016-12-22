import * as React from 'react';
import { findDOMNode, render } from 'react-dom';
import { Tetris } from '../src/tetris';
import { Control } from '../src/control';
import { Controler } from './phone_control';

interface Props {tetris: Tetris, style?: any}
export 
class MainWindow extends React.Component<Props, undefined> {

    private control: Control;
    componentDidMount() {
        let el = findDOMNode(this);
        this.control = new Control(el, this.props.tetris.self, this.props.tetris.nextBlocks);
        this.props.tetris.addChild(this.control);
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return <div style={this.props.style}>
                <Controler tetris={this.props.tetris} game={this}></Controler>
               </div>
    }

    componentWillUnmount() {
        this.props.tetris.deleteChild(this.control);
    }

    getControl = (): Control => {
        return this.control;
    }
}