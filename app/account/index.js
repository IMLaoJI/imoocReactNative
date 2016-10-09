'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
  Dimensions,
  Modal,
  // ProgressBarAndroid,
  AsyncStorage,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons'
import ImagePicker from 'react-native-image-picker'
import Button from 'react-native-button'

import * as Progress from 'react-native-progress'

import sha1 from 'sha1'
import Unit from '../common/unit'
import CFG from '../common/config'

let {width, height} = Dimensions.get('window')
  

export default class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: this.props.user || {},
      avatarProgress: 0,
      avatarUploading: false,
      accessToken:'',

      modalVisible: false
    }
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
  }

  _edit = () => {
    this.setState({
      modalVisible: true
    })
  }

  _closeModal = () => {
    this.setState({
      modalVisible: false
    })
  }

  _submit = () => {
    let that = this
      , user = that.state.user
    that._asyncUser()
  }

  _logout = ()=>{
    this.props.logout()
  }

  _changeUserState = (key, value) => {
    let user = this.state.user
    user[key] = value
    this.setState({
      user: user
    })
  }

  _getQiniuToken() {
    console.log(this.state.user)
    let signatureURL = CFG.api.base + CFG.api.signature
      , accessToken = this.state.user.accessToken
    return Unit.post(signatureURL,{
      accessToken: accessToken,
      cloud: 'qiniu',
    }).catch((err)=>{
      console.log(err)
    })
  }

  _pickPhoto = ()=>{
    let that = this
      , opts = {
        title: '选择头像',
        cancelButtonTitle:'取消',
        takePhotoButtonTitle:'拍照',
        chooseFromLibraryButtonTitle:'选择相册',
        quality: 0.75,
        allowsEditing: true,
        noData: false,
        
        storageOptions: {
          skipBackup: true,
          path: 'images'
        }
      }

    // Alert.alert('res.data')
    ImagePicker.showImagePicker(opts, (res) => {
      if (res.didCancel)  return

      let avatarData = 'data:image/jpeg;base64,' + res.data
        , user = that.state.user

      let timestamp = Date.now()
        , signatureURL = CFG.api.base + CFG.api.signature
        

      that._getQiniuToken()
        .then((data) => {

          if(data && data.success){
            let token = data.data.token
              , key =  data.data.key
              , body =  new FormData()
              , uri = res.uri

            body.append('token', token)
            body.append('key', key)
            body.append('file', {
              type: 'image/jpeg',
              uri: uri,
              name: key
            })

            that._upload(body)
          }
        })

      /*Unit.post(signatureURL,{
        accessToken: accessToken,
        key: key,
        timestamp: timestamp,
        type:'avatar'
      }).catch((err)=>{
      }).then((data) => {
       
        if(data && data.success){
          let signature = data.data

          let body =  new FormData()
          body.append('folder', folder)
          body.append('signature', signature)
          body.append('timestamp', timestamp)
          body.append('tags', tags)
          body.append('api_key', CFG.cloudinary.api_key)
          body.append('resource_type', 'image')
          body.append('file', avatarData)

          that._upload(body)
        }
      })*/

    })
  }

  _upload(body) {
    let xhr =  new XMLHttpRequest()
      // , url = CFG.cloudinary.image
      , url = CFG.qiniu.upload
      , that = this

    console.log(body)

    that.setState({
      avatarUploading: true,
      avatarProgress: 0
    })

    xhr.open('POST', url)
    xhr.onload = () => {
      console.log(xhr)
      if(xhr.status !== 200){
        Alert.alert('请求失败')
        return
      }

      if(!xhr.responseText){
        Alert.alert('请求失败2')
        return
      }

      let response

      try {
        response = JSON.parse(xhr.response)
      }catch(err){
      }

      console.log('upload:====',response )

      if(response){
        let user = that.state.user

        if(response.public_id){
          user.avatar = response.public_id
        }
        if(response.key){
          user.avatar = response.key
        }

        that.setState({
          user: user,
          avatarUploading: false,
          avatarProgress: 0
        })
        that._asyncUser(true)
      }     
    }

    if(xhr.upload){
      xhr.upload.onprogress = (ev)=>{
        if(ev.lengthComputable) {
          let percent = Number((ev.loaded / ev.total).toFixed(2))
          that.setState({
            avatarProgress: percent,
          })
        }
      }
    }

    xhr.send(body)

  }

  _avatar(id, type) {
    let src = null
    if(id.indexOf('http') > -1 || id.indexOf('data:image') > -1){
      src = id
    }

    if(id.indexOf('avatar/') > -1){
      src = CFG.cloudinary.base + '/' + type + '/upload/' + id
    }else{
      src = 'http://oeqkzfns3.bkt.clouddn.com/' + id
    }
    
    console.log(src)
    return src
  }

  _asyncUser(isAvatar) {
    let that = this
      , user = this.state.user

    if(user && user.accessToken){
      let url = CFG.api.base + CFG.api.update
      user.age = parseInt(user.age, 10)  // 后台只支持数字
      Unit.post(url, user)
        .then((data) => {
          if(data && data.success){
            let user = data.data
            user.age = user.age.toString() // 解决TextInput 只支持数字的问题          
            if(isAvatar){
              Alert.alert('头像更新成功。')
            }

            that.setState({
              user: user
            },()=>{
              // that._closeModal()
              AsyncStorage.setItem('user',JSON.stringify(user))
            })

          }
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  render() {
    let user = this.state.user

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>狗狗的账户</Text>
          <Text
            style={styles.toolbarEdit}
            onPress={this._edit}
            >
            编辑
          </Text>
        </View>
        {
        user.avatar
        ?<TouchableOpacity onPress={this._pickPhoto} style={styles.avatorContainer}>
          <Image
            source={{uri: this._avatar(user.avatar, 'image')}}
            resizeMode='cover'
            style={[styles.avatorContainer,{}]}>
            <View style={styles.avatorBox}>
              {
              this.state.avatarUploading
              ?
              <Progress.Circle
                progress={this.state.avatarProgress}
                size={width * 0.2}
                showsText={true}
                color='#333'
                borderColor='#ccc'
              />
              :<Image
                  source={{uri: this._avatar(user.avatar, 'image')}}
                  style={styles.avatar}
                />
              }
              </View>            
            <Text style={styles.avatorTip}>戳这里换头像</Text>
          </Image>
        </TouchableOpacity>
        :<TouchableOpacity style={styles.avatorContainer}  onPress={this._pickPhoto}>
          <View style={styles.avatorBox}>
            {
            this.state.avatarUploading
            ?
            <Progress.Circle
              progress={this.state.avatarProgress}
              size={width * 0.2}
              showsText={true}
              color='#333'
              borderColor='#ccc'
            />
            :<Icon name='ios-cloud-upload' style={styles.iconAvator} />
            }
          </View>
          <Text style={styles.avatorTip}>添加我的头像</Text>
        </TouchableOpacity>
        }
        <Text>{JSON.stringify(this.state)}</Text>
        <Modal
          animateType={'fade'}
          visible={this.state.modalVisible}
          onRequestClose={() => this._setModalVisible(false)}
          >
          <View style={styles.modalContainer}>
            <Icon
              name='ios-close-outline'
              style={styles.iconClose}
              onPress={this._closeModal}
            />
            <View style={styles.fieldItem}>
              <Text style={styles.label}>昵称</Text>
              <TextInput
                placeholder={'输入你的昵称'}
                style={styles.inputField}
                autoCaptialize={true}
                autoCorrect={false}
                defaultValue={user.nickname}
                onChangeText={(text)=>{
                  this._changeUserState('nickname', text)
                }}
              />
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.label}>昵称</Text>
              <TextInput
                placeholder={'输入你的昵称'}
                style={styles.inputField}
                autoCaptialize={true}
                autoCorrect={false}
                defaultValue={user.breed}
                onChangeText={(text)=>{
                  this._changeUserState('breed', text)
                }}
              />
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.label}>年龄</Text>
              <TextInput
                placeholder={'狗狗的年龄'}
                style={styles.inputField}
                autoCaptialize={true}
                keyboardType='numeric'
                autoCorrect={false}
                defaultValue={user.age}
                onChangeText={(text)=>{
                  this._changeUserState('age', text)
                }}
              />
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.label}>性别</Text>
              <Icon.Button
                onPress={() =>{
                  this._changeUserState('gender', 'male')
                }}
                style={[styles.gender,
                  user.gender === 'male' && styles.genderChecked
                ]}
                name='ios-paw'
              >
              男
              </Icon.Button>
              <Icon.Button
                onPress={() =>{
                  this._changeUserState('gender', 'female')
                }}
                style={[styles.gender,
                  user.gender === 'female' && styles.genderChecked
                ]}
                name='ios-paw-outline'
              >
              女
              </Icon.Button>
            </View>
            <Button
                style={styles.submitBtn}
                onPress={this._submit}
              >保存</Button>
          </View>
        </Modal>
        <Button
          style={styles.submitBtn}
          onPress={this._logout}
        >登出</Button>
      </View>
    );
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
  avatorContainer:{
    width: width,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#999'
  },
  avatorTip:{
    color: '#fff',
    fontSize: 14,
  },
  avatorBox:{
    marginTop: 15,
    alignItems: 'center',
    justifyContent:'center',
  },
  iconAvator:{
    padding: 20,
    paddingLeft: 25,
    paddingRight: 25,
    color: '#999',
    fontSize: 27,
    backgroundColor:'#fff'
  },
  avatar:{
    marginBottom:15,
    width: width * 0.2,
    height: width * 0.2,
    resizeMode: 'cover',
    borderRadius: width * 0.2,
    borderWidth:1,
    borderColor: '#ccc'
  },

  modalContainer:{
    flex: 1,
    paddingTop: 45,
    backgroundColor: '#fff',
    margin: 10,
    // borderWidth:1,
    // borderColor:'#ccc'
  },
  fieldItem:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:'center',
    height: 50,
    paddingLeft: 15,
    paddingRight: 15,
    borderColor: '#ccc',
    borderBottomWidth:1,
  },
  label:{
    color: '#999',
    marginRight: 10,
  },
  inputField:{
    flex: 1,
    height: 49,
    padding:5,
    color:'#666',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#999',
    backgroundColor:'#fff',
    borderRadius:4,
  },
  iconClose:{
    alignSelf: 'center',
    fontSize: 30,
    color: 'red'
  },
  gender:{
    backgroundColor: '#ccc'
  },
  genderChecked: {
    backgroundColor: 'red'
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
  }
  
  
});
