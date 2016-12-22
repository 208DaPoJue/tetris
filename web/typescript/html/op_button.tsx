import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';

import { Tetris } from '../src/tetris';
import { Statu } from '../src/message_struct';

interface OpProps {tetris: Tetris, style?: any}
interface OpState { status: Statu, desc: string }

export
class OpButton extends React.Component<OpProps, OpState> {

    constructor(props: OpProps) {
        super(props);
        this.state = {status: Statu.waitting, desc:'准备'};
    }

    componentWillMount(){
        this.props.tetris.addChild(this);
    }

    componentWillUnmount(){
        this.props.tetris.deleteChild(this);
    }

    update = ()=> {
        if (this.props.tetris.self.status != this.state.status) {
            this.updateStatus(this.props.tetris.self.status);
        }
    }

    private updateStatus(status: number) {
        this.setState(this.newState(status));
    }

    private newState(status: number): OpState {
        let desc = ''
        switch(status) {
            case Statu.waitting:
                desc = '准备';
                break;
            case Statu.start:
                desc = '取消';
                break;
            case Statu.run:
                desc = '暂停';
                break;
            case Statu.end:
                desc = '准备';
                break;
        }
        return {status: status, desc: desc};
    }

    onClick = () => {
        if (this.state.status == Statu.waitting) {
            this.props.tetris.start();
        }
    }

    render():JSX.Element | null {
        return  <RaisedButton primary={true} style={this.props.style} disabled= { this.state.status == Statu.end } onClick={this.onClick}>
                    {this.state.desc}
                </RaisedButton>;
    }
}