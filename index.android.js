'use strict';
import React, { Component } from 'react';
import {
  AppRegistry,
} from 'react-native';
import Main from './app/main/index'

class App extends Component {
  render() {
    return <Main />
  }
}

AppRegistry.registerComponent('imoocReactNative', () => App);
