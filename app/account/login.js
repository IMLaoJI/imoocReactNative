'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';

import Button from 'react-native-button'
import {CountDownText} from 'react-native-sk-countdown'

import Unit from '../common/unit'
import CFG from '../common/config'
export default class Login extends Component {
  constructor(props) {
    super(props)  
    this.state = {
      codeSent: false,
      phoneNumber: '',
      verifyCode: '',
      countingDone:false
    }
  }
  _sendVerifyCode = ()=>{
    let that = this
      , phoneNumber = that.state.phoneNumber

    if(!phoneNumber) {
      return Alert.alert('手机号不能为空。')
    }

    let body = {
      phoneNumber: phoneNumber
    }

    Unit.post(CFG.api.base +  CFG.api.signup, body)
      .then((data) => {
        if( data && data.success ) {
          that._showVerifyCode()

        }else{
          Alert.alert('获取验证码失败，请检查手机号是否正确')
        }
      })
      .catch((err) => {
        console.log(err)
        Alert.alert('获取验证码失败，请检查网络是否良好')
      })
  }

  _showVerifyCode() {
    this.setState({
      codeSent: true
    })
  }

  _countingDone= () => {
    this.setState({
      countingDone: true
    })
  }

  _submit = () => {
    let that = this
      , phoneNumber = that.state.phoneNumber
      , verifyCode = that.state.verifyCode

    if(!phoneNumber && !verifyCode) {
      return Alert.alert('手机号或验证码不能为空。')
    }

    let body = {
      phoneNumber: phoneNumber,
      verifyCode: verifyCode
    }

    Unit.post(CFG.api.base +  CFG.api.verify, body)
      .then((data) => {
        if( data && data.success ) {
          that.props.afterLogin(data.data)
        }else{
          Alert.alert('获取验证码失败，请检查手机号是否正确')
        }
      })
      .catch((err) => {
        console.log(err)
        Alert.alert('获取验证码失败，请检查网络是否良好')
      })
  }
  
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>开速登陆</Text>
        </View>
        <View style={styles.body}>
          <TextInput
            placeholder='输入手机号'
            autoCaptialize={'none'}
            autoCorrect={false}
            keyboardType={'numeric'}
            style={styles.inputField}
            onChangeText={(text)=>{
              this.setState({
                phoneNumber: text
              })
            }}
          />
          {
            this.state.codeSent
            ?
            <View style={styles.verifyCodeBox}>
              <TextInput
                placeholder='输入验证码'
                autoCaptialize={'none'}
                autoCorrect={false}
                keyboardType={'numeric'}
                style={styles.inputField}
                onChangeText={(text)=>{
                  this.setState({
                    verifyCode: text
                  })
                }}
              />
              {
                this.state.countingDone
                ?
                <Button
                  style={styles.countBtn}
                  onPress={this._sendVerifyCode}
                >获取验证码</Button>
                :
                <CountDownText
                  style={styles.countBtn}
                  countType='seconds' // 计时类型：seconds / date
                  auto={true} // 自动开始
                  afterEnd={this._countingDone} // 结束回调
                  timeLeft={5} // 正向计时 时间起点为0秒
                  step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                  startText='获取验证码' // 开始的文本
                  endText='获取验证码' // 结束的文本
                  intervalText={(sec) => '剩余秒数'+ sec} // 定时的文本回调
                />
              }
            </View>
            :null
          }
          {
            this.state.codeSent
            ?
            <Button
              style={styles.btn}
              onPress={this._submit}
            >登陆</Button>
            :
            <Button
              style={styles.btn}
              onPress={this._sendVerifyCode}
            >获取验证码</Button>
          }          
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#f9f9f9'
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
  body:{
    padding: 10,
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
  btn:{
    marginTop:10,
    padding:10,
    backgroundColor:'red',
    borderColor:'red',
    borderWidth:1,
    borderRadius:4,
    color:'#fff'
  },
  verifyCodeBox:{
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',

  },
  countBtn:{
    width: 100,
    height: 40,
    padding: 10,
    marginLeft: 10,
    backgroundColor:'red',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'red',
    fontWeight: '600',
    fontSize: 15,
    borderRadius: 2,
  }
});
