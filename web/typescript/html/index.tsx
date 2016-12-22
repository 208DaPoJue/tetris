/// <reference types="material-ui" />

import * as React from 'react';
import { findDOMNode, render } from 'react-dom';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';


import { Tetris } from '../src/tetris';
import { Statu } from '../src/message_struct';
import { OpButton } from './op_button';
import { MainWindow } from './mainwindow';
import { HelperSlider } from './slider';
import injectTapEventPlugin = require('react-tap-event-plugin');
injectTapEventPlugin();

export class App extends React.Component<undefined, undefined> {
    private tetris: Tetris;
    constructor() {
        super();
        this.tetris = new Tetris()
    }

    shouldComponentUpdate = (): boolean=> {
        return false;
    }

    render() {
        let style = {
            container: {
                height: '100%',
                width: '100%',
            },
            host: {
                position: 'relative',
                maxWidth: '960px',
                height: '100%',
                width: '100%',
                margin: 'auto'
            },
            main: {
                height: '100%',
                width:'100%'
            },
            slider: {
                position: 'absolute',
                right: '0',
                top: '0',
                height: '100%',
                width: '20%',
                padding: '5px'
            }
        }
        return <MuiThemeProvider muiTheme={getMuiTheme()}>
            <div style={style.container}>
                <div style={style.host as any}>
                    <MainWindow tetris={this.tetris} style={style.main}/>
                    <HelperSlider tetris={this.tetris} style={style.slider}/>
                </div>
            </div>
        </MuiThemeProvider>
    }
}

render(
  <App />,
  document.getElementById('content')
);