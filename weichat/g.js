/**
 * Created by hoyin on 2017/5/9.
 */
/**
 * Created by hoyin on 2017/5/9.
 */
'use strict'
var sha1 = require('sha1');
var getRawbody = require('raw-body');
var Weichat = require('./weichat');
var util = require('./util');
module.exports = function (opts,handler) {
	var weichat = new Weichat(opts);
	return 	function *(next) {
		var that = this;
		var token = opts.token;
		var signature = this.query.signature;
		var nonce = this.query.nonce;
		var echostr = this.query.echostr;
		var timestamp = this.query.timestamp;

		var str = [token, timestamp, nonce].sort().join('');
		var sha = sha1(str);

		if(this.method ==='GET'){

			if (sha === signature) {
				this.body = echostr + '';
			} else {
				this.body = 'wrong';
			}
		}else if (this.method === 'POST'){
			if (sha !== signature) {
				this.body = 'wrong';
				return false;
			}

			var data = yield getRawbody(this.req,{
				length: this.length,
				limit:'1mb',
				encoding:this.charset
			});
			
			var content = yield util.parseXMLAsync(data);

			console.log(content);

			var message =  util.formatMessage(content.xml);
			console.log(message);

			this.weixin = message;
			yield handler.call(this,next);
			weichat.reply.call(this);
		}

	}
};
