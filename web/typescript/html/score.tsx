import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';

import { Tetris, ISprite } from '../src/tetris';
import { Statu } from '../src/message_struct';

interface OpProps { tetris: Tetris, style?: any }
interface OpState { mine: number, other: number }

export
class Score extends React.Component<OpProps, OpState> implements ISprite {

    constructor(props: OpProps) {
        super(props);
        this.state = {mine: 0, other: 0};
    }

    componentWillMount(){
        this.props.tetris.addChild(this);
    }

    componentWillUnmount(){
        this.props.tetris.deleteChild(this);
    }

    update = ()=> {
    }

    draw = () => {
        this.setState({mine: this.props.tetris.self.score, other: this.props.tetris.opponent.score});
    }
    

    render() {
        let style =  {
            container: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#000'
            },
            span: {
                color: '#fff',
                fontSize: '20px'
            }
            
        }
        return  <div style={style.container}>
                    <span style={style.span}>我的分数：{this.state.mine} </span>
                    <span style={style.span}>对手分数：{this.state.other} </span>
                </div>
    }
}