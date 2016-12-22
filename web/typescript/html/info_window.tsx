import * as React from 'react';
import { findDOMNode, render } from 'react-dom';
import { Tetris } from '../src/tetris';
import { InformationBar } from '../src/control';

interface Props {tetris: Tetris, style?: any}
export 
class InfoWindow extends React.Component<Props, undefined> {

    private control: InformationBar;
    componentDidMount() {
        let el = findDOMNode(this);
        this.control = new InformationBar(el, this.props.tetris);
        this.props.tetris.addChild(this.control);
    }
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return <div style={this.props.style}></div>
    }

    componentWillUnmount() {
        this.props.tetris.deleteChild(this.control);
    }
}