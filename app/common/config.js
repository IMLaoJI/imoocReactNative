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
    base: 'http://rap.taobao.org/mockjs/7532/',
    creations:'api/creations',
    up:'api/up',
    comment:'api/comments'
  }
}