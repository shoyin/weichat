/**
 * Created by hoyin on 2017/5/10.
 */
'use strict'

var Promise = require('bluebird');
var _ = require('lodash');
var request = Promise.promisify(require('request'));
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var util = require('./util');
var fs = require('fs');
var api ={
	accessToken:prefix + 'token?grant_type=client_credential',
	temporary:{
		upload :prefix+'media/upload?'
	},
	permanent:{
		// https://api.weixin.qq.com/cgi-bin/material/add_news?access_token=ACCESS_TOKEN
		upload :prefix+'material/add_material?',
		uploadNews :prefix+'material/add_news?',
		uploadImage :prefix+'media/uploadimg?'
		// uploadNews :prefix+'material/add_news?'
	}
};
function Weichat(opts) {
	var that = this;
	this.appID = opts.appID;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.fetchAccessToken();

}

Weichat.prototype.fetchAccessToken = function () {
	var that = this;

	if(this.access_token && this.expires_in){
		if(this.isValidAccessToken(this)){
			return Promise.resolve(this);
		}
	}

	this.getAccessToken()
		.then(function (data) {
			try {
				data = JSON.parse(data);
			}
			catch (e){
				return that.updateAccessToken();
			}
			if(that.isValidAccessToken(data)){
				return Promise.resolve(data);
			}else {
				return that.updateAccessToken();
			}
		})
		.then(function (data) {
			that.access_token = data.access_token;
			that.expires_in = data.expires_in;
			that.saveAccessToken(data);
			return Promise.resolve(data);
		})
};
Weichat.prototype.isValidAccessToken = function (data) {
	if(!data || !data.access_token ||!data.expires_in){
		return false;
	}
	var access_token = data.access_token;
	var expires_in = data.expires_in;
	var now = (new Date().getTime());
	if(now < expires_in){
		return true;
	}else {
		return false;
	}
};

Weichat.prototype.updateAccessToken = function () {
	var appID = this.appID;
	var appSecret = this.appSecret;
	var url = api.accessToken + "&appid=" + appID + "&secret=" + appSecret;
	return new Promise(function (resolve,reject) {
		request({url:url,json:true}).then(function (response,resutl) {
			var data = response.body;
			var now = (new Date().getTime());
			var expires_in = now + (data.expires_in -20) * 1000;
			data.expires_in = expires_in;
			resolve(data);
		});
	})

};

Weichat.prototype.uploadMaterial = function (type,material,permanent) {
	var that = this;


	var form = {};
	var uploadUrl = api.temporary.upload;

	if(permanent){
		 uploadUrl = api.permanent.upload;

		if(type === 'image'){
			uploadUrl = api.permanent.uploadImage;
		}

		if(type === 'news'){
			uploadUrl = api.permanent.uploadNews;
			form = material;

		}else {
			form.media = fs.createReadStream(material);
		}

		_.extend(form,permanent);

	}else {
		form.media = fs.createReadStream(material);
	}


	var appID = this.appID;
	var appSecret = this.appSecret;
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = uploadUrl + 'access_token=' + data.access_token;


				if(!permanent){
					url += '&type=' + type;
				}else {
					form.access_token = data.access_token;
				}
				var options ={
					method : 'POST',
					url : url,
					json : true
				};

				if(type === 'news'){
					options.body = form;
				}else {
					options.formData = form;
				}

				console.log(options);
				
				request(options).then(function (response) {
					var _data = response.body;
					
					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('faild')
					}
				})
				.catch(function (err) {
					reject(err)
				})
			})
	})
};


Weichat.prototype.reply = function () {

	var content = this.body;
	var message = this.weixin;
	var xml = util.tpl(content,message);
	this.status =200;
	this.type = 'application/xml';
	this.body = xml;
};


module.exports= Weichat;