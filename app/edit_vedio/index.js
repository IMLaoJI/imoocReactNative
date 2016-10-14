'use strict'

import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  AsyncStorage,
  Alert,
} from 'react-native'

import Video from 'react-native-video'
import ImagePicker from 'react-native-image-picker'
import _ from 'lodash'
import {CountDownText} from 'react-native-sk-countdown'
import Icon from 'react-native-vector-icons/Ionicons'
import {AudioRecorder, AudioUtils} from 'react-native-audio'
import * as Progress from 'react-native-progress'

import Unit from '../common/unit'
import CFG from '../common/config'

let {width, height} = Dimensions.get('window')

export default class EditVedio extends Component {
  defualtState = {
    previewVideo: null,
    
    // video upload
    video: null,
    videoUploaded: false,
    videoUploading: false,
    videoUploadedProgress: 0,
    
    // video loads
    videoProgress: 0,
    videoTotal: 0,
    currentTime: 0,

    // audio
    audioPlaying: false,
    recordDone: false,
    audioPath: AudioUtils.DocumentDirectoryPath + '/gougou.aac',

    audio: null,
    audioUploaded: false,
    audioUploading: false,
    audioUploadedProgress: 0,

    // count down
    counting: false,
    recording: false,

    // video play
    rate: 1,
    muted: true, // 控制声音是否为静音
    resizeMode: 'contain',
    repeat: false,
    // paused: false,
  }

  constructor(props) {
    super(props)
    let state = _.clone(this.defualtState)
      , user=this.props.user || {}

    state.user = user
    this.state = state
  }

  componentDidMount(){
    let that = this

    AsyncStorage.getItem('user')
      .then((data)=>{
        let user
        if(data){
          user = JSON.parse(data)
        }

        if(user && user.accessToken){
          that.setState({
            user: user
          })
        }
      })

    this._initAudio()
  }

  _uploadAudio = ()=>{
    let that = this
      , timestamp = Date.now()

    that._getToken({
      type:'audio',
      timestamp: timestamp,
      cloud: 'cloudinary'
    })
    .catch((err)=>{
      console.log(err)
    })
    .then((data) => {
      if(data && data.success){
        let signature = data.data.token
          , key = data.data.key
          , tags = 'app/audio'
          , folder = 'folder'
          , body =  new FormData()

        body.append('folder', folder)
        body.append('signature', signature)
        body.append('timestamp', timestamp)
        body.append('tags', tags)
        body.append('api_key', CFG.cloudinary.api_key)
        body.append('resource_type', 'image')
        body.append('file', {
          type: 'video/mp4',
          uri: that.state.audioPath,
          name: key
        })

        that._upload(body, 'audio')
      }
    })
  }

  _initAudio() {
    let audioPath = this.state.audioPath

    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: 'Low',
      AudioEncoding: 'aac',
      AudioEncodingBitRate: 32000
    })

    console.log('audioPath::' ,audioPath)

    AudioRecorder.onProgress = (data) => {
      this.setState({currentTime: Math.floor(data.currentTime)})
    }
    AudioRecorder.onFinished = (data) => {
      this.setState({finished: data.finished})
      console.log(`Finished recording: ${data.finished}`)
    }
  }


  _getToken(body) {
    let signatureURL = CFG.api.base + CFG.api.signature
    
    body.accessToken = this.state.user.accessToken

    return Unit.post(signatureURL, body)
  }

  _pickVideo = () => {
    let that = this,
      opts = {
        title: '选择视频',
        cancelButtonTitle: '取消',
        takePhotoButtonTitle: '录制十秒视频',
        chooseFromLibraryButtonTitle: '选择已有视频',
        vedioQuality: 'medium',
        mediaType: 'video',
        durationLimit: 10,
        noData: false,
        storageOptions: {
          skipBackup: true,
          path: 'vedio'
        }
      }

    ImagePicker.showImagePicker(opts, (res) => {
      if (res.didCancel) return

      let state = _.clone(that.defualtState)
        , uri = res.uri

      state.previewVideo = uri
      state.user = that.state.user
      console.log('ImagePicker', state)

      this.setState(state, ()=>{
        // that.refs.videoPlayer.seek(0)
      })
      
      that._getToken({
        type:'video',
        cloud:'qiniu'
      })
      .catch((err)=>{
        console.log(err)
        Alert.alert('上传出错')
      })
      .then((data) => {
        if (data && data.success) {
          let token = data.data.token,
            key = data.data.key,
            body = new FormData(),
            uri = res.uri

          body.append('token', token)
          body.append('key', key)
          body.append('file', {
            type: 'vedio/mp4',
            uri: uri,
            name: key
          })
          console.log('_upload Fn')
          that._upload(body, 'video')
        }
      })
    })
  }

  _upload(body, type) {
    let xhr = new XMLHttpRequest()
      , url = CFG.qiniu.upload
      , that = this
      , state = {}
    
    if(type === 'audio'){
      url = CFG.cloudinary.video
    }

    state[type + 'Uploading'] = true
    state[type + 'Uploaded'] = false
    state[type + 'UploadedProgress'] = 0
    that.setState(state)

    xhr.open('POST', url)
    xhr.onload = () => {
      // console.log(xhr)
      if (xhr.status !== 200) {
        Alert.alert('请求失败')
        return
      }

      if (!xhr.responseText) {
        Alert.alert('请求失败2')
        return
      }

      let response

      try {
        response = JSON.parse(xhr.response)
      } catch (err) {}

      console.log('upload:====', response)

      if (response) {
        state[type] = response
        state[type + 'Uploading'] = false
        state[type + 'Uploaded'] = true
        console.log('onload state',state)
        that.setState(state)

        if(type === 'video'){
          let updateURL = CFG.api.base + CFG.api[type]
            , accessToken = this.state.user.accessToken
            , updateBody = {accessToken: accessToken}
          updateBody[type] = response
          Unit.post(updateURL,updateBody)
          .catch((err) => {
            console.log(err)
            Alert.alert('视频同步出错，请重新上传。')
          })
          .then((data) => {
            console.log(data)
            if(!data || !data.success){
              Alert.alert(data.err || '视频同步出错，请重新上传。')
            }
          })
        }

      }
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          let percent = Number((ev.loaded / ev.total).toFixed(2))
            , state = {}
          state[type +'UploadedProgress'] = percent
          that.setState(state)
        }
      }
    }

    xhr.send(body)
  }

  _onLoadStart = () => {
    console.log('_onLoadStart')
  }

  _onLoad = () => {
    console.log('_onLoad')
  }

  _onProgress = (data) => {
    // console.log('_onProgress', data)
    // let duration = data.palyableDuration
    let duration = data.seekableDuration
      , currentTime = data.currentTime
      , precent = Number((currentTime / duration).toFixed(2))

    this.setState({
      videoTotal: duration,
      currentTime: Number(currentTime.toFixed(2)),
      videoProgress: precent
    })
  }

  _onEnd = () => {
    console.log('_onEnd', this.state.recording)
    let state = {}
    if(this.state.recording){
      AudioRecorder.stopRecording()
      state = {
        recordDone: true,
        recording: false
      }
      console.log('_onEnd recording',this.state.recording)
    }

    state.paused = true
    state.videoProgress = 1
    this.setState(state)
  }

  _onError = (err) => {
    console.log('_onError', err)
    this.setState({
      videoOK: false
    })
  }

  _record = () => {
    this.refs.videoPlayer.seek(0)
    this.setState({
      videoProgress: 0,
      counting: false, // 倒计时开始
      recording: true,
      recordDone: false,
      paused: false, //开启播放
    },()=>{
      AudioRecorder.startRecording()
    })

  }

  _counting = () => {
    console.log('_counting')
    if (!this.state.counting && !this.state.recording && !this.state.audioPlaying) {
      this.refs.videoPlayer.seek(this.state.videoTotal)
      this.setState({
        counting: true, // 倒计时开始
        paused: true, //暂停播放
      })

    }
  }

  _preview = ()=>{
    console.log('_preview')
    if(this.state.audioPlaying) {
      AudioRecorder.stopPlaying()
    }
    this.setState({
      videoProgress: 0,
      audioPlaying: true,
      paused: false
    })
    AudioRecorder.playRecording()
    this.refs.videoPlayer.seek(0)
  }


  render() {
    let state = this.state

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
          {state.previewVideo?'点击配音':'理解狗狗从这里开始'}</Text>
          {
            state.previewVideo && state.videoUploaded
            ? <Text
            style={styles.toolbarEdit}
            onPress={this._pickVideo}
            >
            更换视频
            </Text>
            : null
          }
        </View>
        <View style={styles.page}>
          {
            state.previewVideo
            ? <View
                style={styles.videoContainer}
              >
              <View style={styles.videoBox}>
                <Video
                  ref='videoPlayer'
                  source={{uri: this.state.previewVideo}}
                  style={styles.video}
                  volume={5}
                  // paused={state.paused}

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
                  !state.videoUploaded && state.videoUploading
                  ? <View
                    style={styles.progressTipBox}
                  >
                    <Progress.Bar
                      style={styles.progressBar}
                      progress={state.videoUploadedProgress}
                      color='red'
                      borderWidth={0}
                      width={width}
                    />
                    <Text
                      style={styles.progressTip}
                    >
                      正在生成静音视频，已完成:{(state.videoUploadedProgress * 100).toFixed(2)}%
                    </Text>
                  </View>
                  :null
                }

                {
                  state.recording || state.audioPlaying
                  ? <View style={styles.progressTipBox}>
                    <Progress.Bar
                      style={styles.progressBar}
                      progress={state.videoProgress}
                      color='red'
                      borderWidth={0}
                      width={width}
                    />
                    {
                      state.recording
                      ? <Text style={styles.progressTip}>录制声音中</Text>
                      : null
                    }
                  </View>
                  : null
                }

                {
                  state.recordDone
                  ?<TouchableOpacity
                    style={styles.previwAudio}
                    onPress={this._preview}
                  >
                    <View style={styles.previwAudioBox}>
                      <Icon
                        name='ios-play'
                        style={styles.previwIcon}
                      />
                      <Text style={styles.previwText}>预览</Text>
                    </View>
                  </TouchableOpacity> 
                  :null
                }
              </View>
            </View>
            : <TouchableOpacity
              style={styles.uploadContainer}
              onPress={this._pickVideo}
            >
              <View
                style={styles.uploadBox}
              >
                <Image
                  style={styles.uploadIcon}
                  source={require('../assets/images/record.png')}
                />
                <Text
                  style={styles.uploadTitle}
                >点我上传视频</Text>
                <Text
                  style={styles.uploadDesc}
                >建议视频时长不超过20秒</Text>
              </View>
            </TouchableOpacity>
          }
          {
            state.videoUploaded
            ? <View style={styles.recordBox}>
                <View style={[styles.recordIconBox, (state.recording || state.audioPlaying) && styles.recordOn]}>
                {
                  state.counting && !state.recording
                  ? <CountDownText
                    style={styles.countBtn}
                    countType='seconds' // 计时类型：seconds / date
                    auto={true} // 自动开始
                    afterEnd={this._record} // 结束回调
                    timeLeft={3} // 正向计时 时间起点为0秒
                    step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                    startText='准备录制' // 开始的文本
                    endText='Go' // 结束的文本
                    intervalText={(sec) => {
                      return sec===0 ?'Go':sec
                    }}
                  />
                  : <TouchableOpacity
                    onPress={this._counting}
                  >
                    <Icon
                      style={styles.recordIcon}
                      name='ios-mic'
                    />
                  </TouchableOpacity>
                }
                  
                </View>
              </View>
            : null
          }
          {
            state.videoUploaded && state.recordDone
            ? <View style={styles.uploadAudioBox}>
              {
                !state.audioUploaded && !state.audioUploading
                ? <Text style={styles.uploadAudioText} onPress={this._uploadAudio}>下一步</Text>
                : null
              }
              {
                state.audioUploading
                ? <Progress.Circle
                  progress={state.audioUploadProgress}
                  size={60}
                  showsText={true}
                  color='#333'
                  borderColor='#ccc'
                />
                : null
              }
            </View>
            : null
          }
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#fff'
  },
  header:{
    height:48,
    padding: 10,
    paddingTop:12,
    paddingBottom:12,
    backgroundColor:'red',
    flexDirection: 'row',
  },
  headerTitle:{
    flex: 1,
    color:'#fff',
    fontSize: 16,
    lineHeight:24,
    textAlign: 'center',
    fontWeight: '600'
  },
  toolbarEdit:{
    color: '#fff'
  },
  page: {
    flex: 1,
    alignItems: 'center'
  },
  uploadContainer: {
    marginTop: 90,
    width: width - 40,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: 'red',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#fff'
  },
  uploadTitle: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
    color: '#333'
  },
  uploadDesc: {
    color:'#999',
    textAlign: 'center',
    fontSize: 12,
  },
  uploadIcon: {
    width: 110,
    height: 110,
    resizeMode: 'contain'
  },
  uploadBox: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10
  },

  videoContainer:{
    width: width,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  videoBox:{
    width: width,
    height: width * 0.56,
    backgroundColor:'#000'
  },
  video:{
    width: width,
    height: width * 0.56
  },
  progressTipBox:{
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 9,
    width: width,
    height: 30,
    backgroundColor: 'rgba(244,244,244,0.65)',
  },
  progressTip: {
    color: '#333',
    width: width - 10,
    padding: 5,
  },
  progressBar: {
    width: width,
    height: 3,
    backgroundColor:'rgba(255,125,125,0.65)'
  },
  recordBox:{
    width: width,
    height: 60,
    alignItems: 'center'
  },
  recordIconBox: {
    width: 64,
    height: 64,
    marginTop: -32,
    borderRadius: 32,
    backgroundColor:'red',
    borderColor:'#fff',
    alignItems:'center',
    justifyContent: 'center'
  },
  recordIcon:{
    fontSize: 58,
    color:'#fff'
  },
  countBtn:{
    fontSize: 32,
    color:'#fff',
    fontWeight:'600'
  },
  recordOn: {
    backgroundColor: '#ccc'
  },
  previwAudioBox:{
    flexDirection:'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  previwAudio:{
    width: 80,
    height: 30,
    position: 'absolute',
    zIndex:9,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'rgba(255,255,255,0.65)'
  },
  previwIcon:{
    marginRight:5,
    fontSize: 20,
    color: 'red',
  },
  previwText:{
    fontSize: 20,
    color: 'red',
  },
  uploadAudioBox:{
    width: width,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadAudioText:{
    width: width - 40,
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 30,
    color: 'red'
  },
})
