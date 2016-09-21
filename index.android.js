'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Navigator,
} from 'react-native';

import TabBar from './app/module/tabbar'
import List from './app/creation/index'
import EditorVedio from './app/edit_vedio/index'
import Account from './app/account/index'

class App extends Component {
  render() {
    let icon = require('./app/image/start_normal.png')
      , selectedIcon = require('./app/image/start_hightlight.png')

    return (
      <TabBar>
        <TabBar.Item
          icon = {icon}
          selectedIcon = {selectedIcon}
          onPress = {() => {}}
          badge = {7}
          title = '首页'
        >
        <Navigator
          initialRoute= {{
            name:'list',
            component: List
          }}
          configureScene={(route) => {
            return Navigator.SceneConfigs.FloatFromRight
          }}
          renderScene={(route, navigator) => {
            var Component = route.component
            return <Component
              {...route.params}
              navigator={navigator}
            />
          }}
        />
        </TabBar.Item>
        <TabBar.Item
          icon={icon}
          selectedIcon={selectedIcon}
          title='制作视频'
          point={true}
          style={{width:50}}
        >
        <EditorVedio  style={{backgroundColor:'red'}} />
        </TabBar.Item>
        <TabBar.Item
          icon={icon}
          selectedIcon={selectedIcon}
          title='我的'
          badge = {true}
        >
        <Account  style={{backgroundColor:'red'}} />
        </TabBar.Item>
      </TabBar>
    )

  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

AppRegistry.registerComponent('imoocReactNative', () => App);
