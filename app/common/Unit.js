'use strict';

import queryString from 'query-string'
import _ from 'lodash'
import Mock from 'mockjs'
import config from './config'

module.exports = {
  get: function(url, params){
    if(params){
      url +='?' + queryString.stringify(params)
    }
    console.log('get===:', url)
    return fetch(url)
      .then((res) => res.json())
      .then((res) => Mock.mock(res))
  },
  post: function(url, body){
    let opts = _.extend(config.header, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    console.log('post===:', url, opts)
    return fetch(url, opts)
      .then((res) => res.json())
      .then((res) => Mock.mock(res))
  }
}