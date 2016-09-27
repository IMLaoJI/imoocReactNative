'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Image,
  ListView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';

import Video from 'react-native-video'
import Icon from 'react-native-vector-icons/Ionicons'
import Button from 'react-native-button'
import Unit from '../common/unit'
import CFG from '../common/config'


let {width, height} = Dimensions.get('window')

export default class Detail extends Component {
  constructor(props) {
    super(props)
    let {data} = this.props

    this.state = {
      data: data,
      // video loads
      videoOK: true,
      videoLoaded: false,
      playing: false,
      paused: false,
      videoProgress: 0,
      videoTotal: 0,
      currentTime: 0,
      // video play
      rate: 1,
      muted: false,
      resizeMode: 'contain',
      repeat: false,

      // comments
      dataSource: this._ds().cloneWithRows([]),
      isRefreshing: false,
      isLoading: false,
      nextPage: 1,
      commentsData:[],
      comments:0,
      content:'',

      // modal
      modalVisible: false,
      animationType: 'none',
      isSending: false,

    }

  }

  _pop = () => {
    this.props.navigator.pop()
  }

  _ds() {
    return new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    })
  }
  
  _onLoadStart = () => {
    console.log('_onLoadStart')
  }

  _onLoad = () => {
    console.log('_onLoad')
  }

  _onProgress = (data) => {
    let duration = data.playableDuration
      , currentTime = data.currentTime
      , precent = Number((currentTime / duration).toFixed(2))
      , states = {
        videoTotal: duration,
        currentTime: Number(data.currentTime.toFixed(2)),
        videoProgress: precent
      }

    if(!this.state.videoLoaded){
      states.videoLoaded = true
    }

    if(!this.state.playing){
      states.playing = true
    }
    this.setState(states)
  }

  _onEnd = () => {
    this.setState({
      videoProgress: 1,
      playing: false,
      // repeat: true,
    })
    console.log('_onEnd')
  }

  _onError = (err) => {
    console.log('_onError', err)
    this.setState({
      videoOK: false
    })
  }

  _rePlay = () => {
    this.refs.videoPlayer.seek(0)
  }

  _pause = () => {
    if(!this.state.paused){
      this.setState({
        paused: true,
      })
    }
  }

  _resume = () => {
    if(this.state.paused){
      this.setState({
        paused: false,
      })
    }
  }

  componentDidMount() {
    this._fetchData()
  }

  _renderRow = (data) => {
    return (
      <View style={styles.replyBox} key={data._id}>
        <Image
          style={styles.replyAvatar}
          source={{uri: data.replyBy.avatar}}
        />
        <View style={styles.reply} >
          <Text style={styles.replyNickename} >
            {data.replyBy.nickname}
          </Text>
          <Text style={styles.replyContent} >
            {data.content}
          </Text>
        </View>
      </View>
    )
  }

  _fetchData(page) {
    let that = this
      , states = {}
      , url = CFG.api.base + CFG.api.comment

    if( page !== 0 ) states.isLoading = true
    else states.isRefreshing = true

    that.setState(states)

    Unit.get(url, {
        accessToken: CFG.api.accessToken,
        page: page,
        creation: this.state.data._id,
      })
      .then((data) => {
        if(data.success){
          let datas = that.state.commentsData.slice()
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

          states.commentsData = items
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
    return this.state.total !== this.state.commentsData.length
  }

  _fetchMoreData = ()=>{
    if(!this._hasMore() || this.state.isLoading){
      return
    }
    let page = this.state.nextPage
    this._fetchData(page)
  }

  _renderHeader = () => {
    let data = this.state.data
    console.log('_renderHeader:::',data)
    return (
      <View style={styles.listHeader}>
        <View style={styles.infoBox}>
          <Image
            style={styles.avatar}
            source={{uri: data.autor.avatar}}
          />
          <View style={styles.descBox} >
            <Text style={styles.nickename} >
              {data.autor.nickname}
            </Text>
            <Text style={styles.title} >
              {data.title}
            </Text>
          </View>
        </View>
        <View style={styles.commentBox}>
          <View style={styles.comment}>
            <Text>来评论一下：</Text>
            <TextInput
              ref='textInput'
              placeholder="好喜欢这个视频呀…"
              style={styles.textInput}
              multiline={true}
              onFocus={this._focus}
            />
          </View>
        </View>
        <View style={styles.commentArea}>
          <Text style={styles.commentTitle}>精彩评论</Text>
        </View>
      </View>
    )
  }

  _renderFooter= () => {
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

  _focus = () => {
    this._setModalVisible(true)
  }

  _blur = () => {
    // this.refs['textInput'].blur()
  }

  _colseModal = () => {
    this._setModalVisible(false)
  }

  _setModalVisible(isVisible) {
    this.setState({
      modalVisible: isVisible
    })
    
  }

  _submit = () => {
    let that = this

    if(!that.state.content){
      return Alert.alert('留言不能为空')
    }

    if(that.state.isSending){
      return Alert.alert('正在评论中！'+that.state.isSending.toString())
    }

    that.setState({
      isSending: true
    }, () => {
      let body = {
          accessToken: CFG.api.accessToken,
          creation: that.state.data._id,
          content: that.state.content
        }
        , url = CFG.api.base + CFG.api.commentPost

      Unit.post(url, body)
        .then((data) => {
          if(data && data.success){
            let items = that.state.commentsData.slice()
            items = [{
              content: that.state.content,
              replyBy: {
                nickname:'狗狗说',
                avatar: '"http://dummyimage.com/128X128/09071d)'
              }
            }].concat(items)

            that.setState({
              dataSource: that.state.dataSource.cloneWithRows(items),
              commentsData: items,
              total: that.state.total + 1,
              isSending: false,
              content:''
            })

            that._setModalVisible(false)

          }else{
            that.setState({
              isSending: false
            })
            that._setModalVisible(false)
            Alert.alert('留言失败，稍候再试。')
          }
        })
        .catch((err)=>{
          console.log(err)
          that.setState({
            isSending: false
          })
          that._setModalVisible(false)
          Alert.alert('err:留言失败，稍候再试。')
        })
    })
  }

  render() {
    let {data} = this.props
      , state = this.state
      , url = require('./broadchurch.mp4')

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBox}
            onPress={this._pop}
          >
            <Icon
              name="ios-arrow-back"
              style={styles.iconBack}
            />
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <Text
            style={styles.headerTitle}
            numberOflines={1}
          >
            视频详情页
          </Text>
        </View>
        <View style={styles.videoBox}>
          <View style={styles.video}>
          <Video
            ref='videoPlayer'
            // source={{uri: data.video}}
            source={url}
            style={styles.video}
            volume={5}
            paused={this.state.paused}

            rote={state.rate}
            muted={state.muted}
            resizeMode={state.resizeMode}
            repeat={state.repeat}

            onLoadStart= {this._onLoadStart}
            onLoad= {this._onLoad}
            onProgress={this._onProgress}
            onEnd= {this._onEnd}
            onError= {this._onError}
          />
          {
            !state.videoOK && <Text onPress={this._pop} style={styles.failText}>视频出错了, 抱歉。</Text>
          }
          {
            state.videoOK && !state.videoLoaded && <ActivityIndicator color='#fff' style={styles.loading} />
          }

          {
            state.videoLoaded && !state.playing
            ?
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={this._rePlay}
            >
              <View
                style={styles.play}
                >
                <Icon
                  name="ios-play"
                  style={styles.iconPlay}
                 />
               <Text>重播</Text>
              </View>
            </TouchableOpacity>
            : null
          }
          {
            state.videoLoaded && state.playing
            ?
            <TouchableOpacity
              onPress={this._pause}
              style={styles.pauseBtn}
            >
            {
              state.paused
              ? <View style={styles.play}><Icon onPress={this._resume} name='ios-play' style={styles.iconPlay} /></View>
              : <Text />
            }
            </TouchableOpacity>
            : null
          }
          </View>
          <View style={styles.progressBox}>
            <View style={[styles.progressBar,{width: width * state.videoProgress}]}></View>
          </View>
        </View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          enableEmptySections={true}
          automaticallyAdjustContentInsets={false}
          showsVerticalScrollIndicator={false}
          renderHeader={this._renderHeader}
          renderFooter={this._renderFooter}
          refreshControl={this._refreshControl()}
          onEndReached={this._fetchMoreData}
          onEndReachedThreshold={64}
        />
        <Modal
          animationType={'fade'}
          visible={this.state.modalVisible}
          onRequestClose={() => this._setModalVisible(false)}
          >
          <View style={styles.modalContainer}>
            <Icon
              onPress={this._colseModal}
              name='ios-close-outline'
              style={styles.iconClose}
            />
            <View style={styles.commentBox}>
              <View style={styles.comment}>
                <Text>来评论一下：</Text>
                <TextInput
                  ref='textInput2'
                  placeholder="好喜欢这个视频呀…"
                  style={styles.textInput}
                  multiline={true}
                  defaultValue={this.state.content}
                  onChangeText={(text)=>{
                    this.setState({
                      content: text
                    })
                  }}
                />
              </View>
              <Button
                style={styles.submitBtn}
                onPress={this._submit}
              >评论</Button>
            </View>
          </View>
        </Modal>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
  },
  backBox: {
    flexDirection: 'row',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    textAlign: 'center',
  },
  iconBack: {
    color: '#999',
    fontSize: 20,
    marginRight: 5
  },
  backText: {
    color: '#999',
  },

  videoBox: {
    width: width,
    height: width * 0.56 + 2,
    backgroundColor: '#000'
  },
  video: {
    width: width,
    height: width * 0.56,
    backgroundColor: '#000',
    // zIndex: 0
  },
  loading: {
    position: 'absolute',
    left: 0,
    top: width * 0.25,
    width: width,
    alignSelf: 'center',
  },
  progressBox: {
    width: width,
    height: 2,
    backgroundColor: '#ccc',    
  },
  progressBar: {
    width: 0.01,
    height: 2,
    backgroundColor: 'red'
  },
  play: {
    position: 'absolute',
    bottom: width * 0.56 / 2 - 24,
    right: width / 2 - 24,
    width: 48,
    height: 48,
    paddingTop: 6,
    paddingLeft: 16,
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 24,
  },
  iconPlay: {
    fontSize: 30,
    color: '#fff',
  },
  pauseBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width,
    height: width * 0.56
  },
  failText: {
    position: 'absolute',
    left: 0,
    top: width * 0.25,
    width: width,
    textAlign: 'center',
    color: '#fff'
  },
  infoBox: {
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingBottom:5,
    borderBottomWidth:1,
    marginBottom:5,
    borderColor:'#ccc',
    borderStyle: 'dashed'
  },
  avatar: {
    width: 64,
    height: 64,
    marginRight: 5,
    borderRadius: 32,
    // backgroundColor:'#ccc'
  },
  descBox: {
    flex: 1,
  },
  nickename: {
    fontSize: 18,
  },
  title: {
    marginTop: 8,
    fontSize: 16,
    color: '#666'
  },
  replyBox: {
    marginTop: 10,
    paddingLeft: 18,
    paddingRight: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingBottom:5,
    borderBottomWidth:1,
    marginBottom:5,
    borderColor:'#ccc',
    borderStyle: 'dashed'
  },
  replyAvatar: {
    width: 48,
    height: 48,
    marginRight: 5,
    borderRadius: 24,
    // backgroundColor:'#999'
  },
  reply: {
    flex: 1
  },
  replyNickename: {
    color: '#666'
  },
  replyContent: {
    marginTop: 5,
    color: '#666'

  },
  loadingMore:{
    marginVertical: 20,
  },
  loadingText:{
    color: '#999',
    textAlign: 'center'
  },
  commentBox: {
    marginTop: 10,
    marginBottom: 10,
    padding: 8,
    width: width,
  },
  textInput: {
    paddingLeft: 2,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    fontSize: 14,
    height: 80,
  },
  listHeader: {
    marginTop: 10,
  },
  commentArea: {
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalContainer:{
    flex: 1,
    paddingTop: 45,
    backgroundColor: '#fff'
  },
  iconClose:{
    alignSelf: 'center',
    fontSize: 30,
    color: 'red'
  },
  submitBtn: {
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'yellow',
    fontSize: 18,
    color: '#fff',
    backgroundColor: 'red'
  },
  
  inputField:{
    flex: 1,
    height: 40,
    padding:5,
    color:'#666',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#999',
    backgroundColor:'#fff',
    borderRadius:4,
  },
});
