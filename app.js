/**
 * Created by hoyin on 2017/5/9.
 */
'use strict'

var Koa = require('koa');
// var sha1 = require('sha1');
var path = require('path');
var weichat = require('./weichat/g');
var util = require('./libs/util');
var config = require('./config');
var weixin = require('./weixin');
var weichat_file = path.join(__dirname,'./config/weichat.txt');

var app = new Koa();

app.use(weichat(config.weichat,weixin.reply));
app.listen(1234);
console.log('runing 1234');