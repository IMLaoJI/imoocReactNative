'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Navigator,
  ScrollView,
  Text,
  View,
  Alert,
  AsyncStorage,
} from 'react-native';

import TabBar from '../module/tabbar'
import List from '../creation/index'
import EditorVedio from '../edit_vedio/index'
import Account from '../account/index'
import Login from '../account/login'

import ScrollableTabView, { ScrollableTabBar, } from 'react-native-scrollable-tab-view'
import FacebookTabBar from '../module/bar'

 

export default class Main extends Component {
  constructor(props) {
    super(props);
  
    this.state = {
      user: null,
      logined: false,
      selectedTab:1
    };
  }
  componentDidMount() {
    this._asyncAppstatus()
  }


  _asyncAppstatus() {
    let that = this

    AsyncStorage.getItem('user')
      .then((data) => {
        let user
          , newSate ={}

        if(data) {
          user = JSON.parse(data)
        }

        if(user && user.accessToken) {
          newSate.user = user
          newSate.logined = true
        }else{
          newSate.logined = false
        }

        that.setState(newSate)
      })
  }
  _afterLogin = (user) => {
    let that = this
    user = JSON.stringify(user)
       
    AsyncStorage.setItem('user', user)
      .then(() => {

        console.log('ddddd', user)
        that.setState({
          logined: true,
          user: user
        })
      })
  }

  _logout = () => {
    AsyncStorage.removeItem('user')
    this.setState({
      logined: false,
      user:null
    })
  }

  render() {
   if(!this.state.logined){
     return <Login afterLogin={this._afterLogin} />
   }
   return (
    <ScrollableTabView
      tabBarPosition='bottom'
      initialPage={this.state.selectedTab}
      renderTabBar={() => <FacebookTabBar />}
      >

      <Navigator
        tabLabel={{icon:'ios-home',title:'首页',colorSelect:'red'}}
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
      
      <EditorVedio tabLabel={{icon:'ios-chatboxes',title:'编辑视频',colorSelect:'red'}} />
      <Account
        user={this.state.user}
        logout={this._logout}
        tabLabel={{icon:'ios-more',title:'我的',colorSelect:'red'}}
      />
    </ScrollableTabView>
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