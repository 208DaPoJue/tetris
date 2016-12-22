import * as React from 'react';
import { findDOMNode, render } from 'react-dom';
import { Tetris } from '../src/tetris';
import { Control } from '../src/control';
import { OpButton } from './op_button';
import { InfoWindow } from './info_window';
import { Score } from './score';


interface Props {tetris: Tetris, style?: any}
export
class HelperSlider extends React.Component<Props, undefined> {
     render() {
        let styles= {
            button: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                marginTop: '15px'
            },
            window: {
                minHeight: '480px',
            }
        }
        return <div style={this.props.style}>
                    <InfoWindow tetris={this.props.tetris} style={styles.window}/>
                    <Score tetris={this.props.tetris}/>
                    <div style={styles.button}>
                        <OpButton tetris={this.props.tetris}/>
                    </div>
                </div>
    }
}