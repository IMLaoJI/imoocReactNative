'use strict';

module.exports = {
  header:{
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },    
  },
  api:{
    accessToken:'abc',
    base: 'http://rap.taobao.org/mockjs/7532/api/',
    creations: 'creations',
    up: 'up',
    comment: 'comments',
    commentPost: 'commentsPost',
    signup: 'user/signup',
    verify: 'user/verify',
    update: 'user/update',
    signature: 'signature',
  },
  cloudinary:{
    cloud_name: 'colpu',  
    api_key: '188147535253851',  
    api_secret: 'wIGrwGq3AMr60fvbOsnyjpeZM58',
    base: 'http://res.cloudinary.com/colpu',
    image: 'https://api.cloudinary.com/v1_1/colpu/image/upload',
    video: 'https://api.cloudinary.com/v1_1/colpu/video/upload',
    audio: 'https://api.cloudinary.com/v1_1/colpu/audio/upload',
  }
}