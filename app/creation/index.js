'use strict'

import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ListView,
  Image,
  TouchableOpacity,
  TouchableHighlight,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import Unit from '../common/Unit'
import CFG from '../common/config'

import Detail from './detail'

let {width, height} = Dimensions.get('window')

class Item extends Component {
  constructor(props) {
    super(props)
    let data = this.props.row;
    this.state = {
      up: data.voted,
      data: data
    }    
  }

  _up() {
    let up = !this.state.up
      , data = this.state.data
      , url = CFG.api.base + CFG.api.up

    let body = {
      id: data._id,
      up: up ? true : false,
      accessToken: CFG.api.accessToken
    }

    Unit.post(url, body)
      .then((data) => {

        if (data && data.success){
          this.setState({
            up: up
          })
        }else{
          Alert.alert('点赞失败，稍候重试')
        }
      })
  }

  render() {
    let data = this.state.data
    return (
      <TouchableHighlight onPress={this.props.onSelect}>
        <View style={styles.item}>
          <Text style={styles.title}>{data._id+data.title}</Text>
          <Image
            source={{uri: data.thumbnail}}
            style={styles.thumbnail}
          >
            <View style={styles.play}>
              <Icon
                name="ios-play"
                size={24}
                style={styles.iconPlay}
              />
            </View>
          </Image>
          <View style={styles.itemFooter}>
            <TouchableOpacity
              style={styles.handleBox}
              onPress={this._up.bind(this)}
            >
              <Icon
                name={this.state.up ? 'ios-heart':'ios-heart-outline'}
                size={24}
                style={[styles.iconHart,
                  this.state.up?styles.iconHartDown:null
                ]}
              />
              <Text
                style={[styles.handleText,this.state.up?styles.iconHartDown:null]}
              >
                喜欢
              </Text>
            </TouchableOpacity>
            <View style={styles.handleBox}>
              <Icon
                name="ios-chatboxes-outline"
                size={24}
                style={styles.iconComment}
              />
              <Text style={styles.handleText}>
                评论
              </Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    ) 
  }
}

export default class List extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isRefreshing: false,
      isLoading: false,
      nextPage: 1,
      data:[],
      total:0,
      dataSource: this._ds().cloneWithRows([]),
    }
  }

  _ds() {
    return new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    })
  }

  _renderRow(data) {
    return (<Item
      key={data._id}
      onSelect={() => this._loadPage(data)}
      row={data}
    />)
  }
  

  _fetchData(page) {
    let that = this
      , states = {}

    if( page !== 0 ) states.isLoading = true
    else states.isRefreshing = true

    that.setState(states)

    Unit.get(CFG.api.base + CFG.api.creations, {
        accessToken: CFG.api.accessToken,
        page: page
      })
      .then((data) => {
        if(data.success){
          let datas = that.state.data.slice()
          let items = []
            , states = {}

          if( page !== 0 ){
            items = datas.concat(data.data)
            states = {
              nextPage: this.state.nextPage + 1,
              isLoading: false,
            }
          }else{
            items = (data.data).concat(datas)
            states = {
              isRefreshing: false,
            }
          }

          states.data = items
          states.total = data.total
          states.dataSource = that.state.dataSource.cloneWithRows(items)
          
          setTimeout(function(){
            that.setState(states)
          },0)
        }

      })
      .catch((error) => {
        let states = {}

        if(page !== 0) states.isLoading = false
        else states.isRefreshing = false

        that.setState(states)
        console.error(error)
      })
  }

  _hasMore() {
    return this.state.total !== this.state.data.length
  }

  _fetchMoreData = ()=>{
    if(!this._hasMore() || this.state.isLoading){
      return
    }
    let page = this.state.nextPage
    this._fetchData(page)
  }

  _renderFooter= ()=>{
    if(!this._hasMore() && this.state.total !== 0) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>没有更多了</Text>
        </View>
      )
    }
    if (!this.state.isLoading){
      return (<View />)
    }
    if( this.state.nextPage === 1){
      return (
        <View style={[styles.center,{marginTop:30}]}>
          <View>
            <ActivityIndicator style={styles.loadingMore}/>
            <Text>数据加载中请稍候…</Text>
          </View>
        </View>
      )
    }
    return (<ActivityIndicator style={styles.loadingMore}/>)
  }

  _refreshControl = ()=> {

    return (<RefreshControl
      refreshing={this.state.isRefreshing}
      onRefresh={this._onRefresh}
      tintColor="#ff0000"
      title="加载中..."
      titleColor="#00ff00"
      colors={['#ff0000', '#00ff00', '#0000ff']}
      progressBackgroundColor="#ffff00"
    />)
  }

  _onRefresh = ()=> {
    if(this.state.isRefreshing || !this._hasMore()) return
    this._fetchData(0)
  }

  _loadPage(data) {
    this.props.navigator.push({
      name: 'detail',
      component: Detail,
      params:{
        data: data
      }
    })
  }

  componentDidMount() {
    this._fetchData()
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>列表页面</Text>
        </View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)}
          renderHeader={null}
          renderFooter={this._renderFooter}
          refreshControl={this._refreshControl()}          
          enableEmptySections={true}
          onEndReached={this._fetchMoreData}
          onEndReachedThreshold={height / 3}
          showsVerticalScrollIndicator={false}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header:{
    height:48,
    paddingTop:12,
    paddingBottom:12,
    backgroundColor:'red',
  },
  headerTitle:{
    color:'#fff',
    fontSize: 16,
    lineHeight:24,
    textAlign: 'center',
    fontWeight: '600'
  },
  item:{
    width: width,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  title:{
    padding:10,
    color: '#333',
    fontSize: 16,
    lineHeight:32
  },
  thumbnail:{
    width: width,
    height: width * 0.56,
    resizeMode: 'cover'
  },
  play:{
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 48,
    height: 48,
    paddingTop: 6,
    paddingLeft:16,
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 24,
  },
  itemFooter:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eee'
  },
  handleBox:{
    padding: 10,
    flexDirection: 'row',
    width: width / 2 - 0.5,
    justifyContent: 'center',
    backgroundColor: '#fff',

  },
  handleText: {
    paddingLeft:4,
    paddingTop:1,
    fontSize: 16,
    color: '#333',
  },
  iconPlay:{
    fontSize: 30,
    color:'#fff',
  },
  iconHart:{
    fontSize:24,
    color: '#333',
  },
  iconHartDown:{
    color: 'red',
  },
  iconComment:{
    fontSize: 22,
    color: '#333',
  },
  loadingMore:{
    marginVertical: 20,
  },
  loadingText:{
    color: '#999',
    textAlign: 'center'
  },
})
