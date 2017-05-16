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
		upload :prefix+'media/upload?',
		fetch :prefix+'media/get?'
	},
	permanent:{
		// https://api.weixin.qq.com/cgi-bin/material/add_news?access_token=ACCESS_TOKEN
		upload :prefix+'material/add_material?',
		fetch :prefix+'material/get_material?',
		uploadNews :prefix+'material/add_news?',
		uploadImage :prefix+'media/uploadimg?',
		update :prefix+'media/update_news?',
		del :prefix+'media/del_material?',
		count :prefix+'media/get_materialcount?',
		batch :prefix+'media/batchget_materialcount?',
		// uploadNews :prefix+'material/add_news?'
	},
	group:{
		create:prefix + 'groups/create?',
		get:prefix + 'groups/get?',
		check:prefix + 'groups/getid?',
		update:prefix + 'groups/update?',
		move:prefix + 'groups/members/update?',
		batchupdate:prefix + 'groups/members/batchupdate?',
		del:prefix + 'groups/delete?',

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

			_.extend(form,permanent);
		}else {
			form.media = fs.createReadStream(material);
		}



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
					
					console.log(form);
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

Weichat.prototype.fetchMaterial = function (mediaId,type,permanent) {
	var that = this;
	
	var fetchUrl = api.temporary.fetch;

	if(permanent){
		fetchUrl = api.permanent.fetch;
	}

	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = fetchUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId;
				var form = {};
				var options ={
					method : 'POST',
					url : url,
					json : true
				};
				if(permanent){
					form.media_id = mediaId;
					form.access_token = data.access_token;
					options.body = form
				}else {

					if(type ==="video"){
						url.replace('https://','https://');
					}

					url += "&media_id" + mediaId
				}
				if(type ==='news' || type ==="vedio"){

					request(options).then(function (response) {
						var _data = response.body;
						if(_data){
							resolve(_data);
						}else {
							throw new Error('faild')
						}
					});
				}else {
					resolve(url);
				}

		})
	})
};

Weichat.prototype.delMaterial = function (mediaId) {
	var that = this;
	var form = {
		media_id :mediaId
	};
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId;

				var options ={
					method : 'POST',
					url : url,
					json : true,
					body:form
				};

				request(options).then(function (response) {
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else {
						throw new Error('faild')
					}
				});
			})
	})
};

/*
Weichat.prototype.updateMaterial = function (mediaId,news) {
	var that = this;
	var form = {
		media_id :mediaId
	};

	_.extend(form,news);
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId;
				var options ={
					method : 'POST',
					url : url,
					json : true,
					body:form
				};

				request(options).then(function (response) {
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else {
						throw new Error('faild')
					}
				});
			})
	})
};
*/


Weichat.prototype.countMaterial = function () {
	var that = this;

	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.permanent.count + 'access_token=' + data.access_token;
				var options ={
					method : 'GET',
					url : url,
					json : true
				};

				request(options).then(function (response) {
					var _data = response.body;

					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('faild')
					}
				})
			})
	})
};

Weichat.prototype.batchMaterial = function (options) {
	var that = this;

	options.type = options.type ||'image';
	options.offset = options.offset ||0;
	options.count = options.count ||1;
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.permanent.batch + 'access_token=' + data.access_token;
				var option ={
					method : 'POST',
					url : url,
					json : true,
					body:options

				};

				request(option).then(function (response) {
					var _data = response.body;

					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('faild')
					}
				})
			})
	})
};


Weichat.prototype.createGroup = function (name) {

	var that = this;
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.group.create + 'access_token=' + data.access_token;

				var options ={
					group:{
						name:name
					}
				};
				var urlData ={
					method : 'POST',
					url : url,
					json : true,
					body:options

				};

				request(urlData).then(function (response) {
					var _data = response.body;

					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('create')
					}
				})
			})
	})
};

Weichat.prototype.fetchGroup = function (name) {

	var that = this;
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.group.get + 'access_token=' + data.access_token;

				var urlData ={
					url : url,
					json : true,

				};

				request(urlData).then(function (response) {
					var _data = response.body;

					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('fetch')
					}
				})
			})
	})
};


Weichat.prototype.checkGroup = function (openId) {

	var that = this;
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.group.check + 'access_token=' + data.access_token;


				var options ={
					openid:openId
				};
				var urlData ={
					method : 'POST',
					url : url,
					json : true,
					body:options

				};

				request(urlData).then(function (response) {
					var _data = response.body;

					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('check')
					}
				})
			})
	})
};



Weichat.prototype.updateGroup = function (id,name) {

	var that = this;
	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				var url = api.group.update + 'access_token=' + data.access_token;


				var options ={
					group:{
						id:id,
						name:name
					}
				};
				var urlData ={
					method : 'POST',
					url : url,
					json : true,
					body:options

				};

				request(urlData).then(function (response) {
					var _data = response.body;

					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('update')
					}
				})
			})
	})
};


// Weichat.prototype.moveGroup = function (openid,to) {
//
// 	var that = this;
// 	return new Promise(function (resolve,reject) {
// 		that
// 			.fetchAccessToken()
// 			.then(function (data) {
// 				var url = api.group.move + 'access_token=' + data.access_token;
//
//
// 				var options ={
// 					openid:openid,
// 					to_groupid:to
// 				};
// 				var urlData ={
// 					method : 'POST',
// 					url : url,
// 					json : true,
// 					body:options
//
// 				};
//
// 				request(urlData).then(function (response) {
// 					var _data = response.body;
//
// 					console.log(_data);
// 					if(_data){
// 						resolve(_data);
// 					}else {
// 						throw new Error('move')
// 					}
// 				})
// 			})
// 	})
// };

Weichat.prototype.batchmoveGroup = function (openids,to) {

	var that = this;

	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {

				var options ={
					to_groupid:to
				};
				if(_.isArray(openids)){
					
					console.log(1111111111);
					var url = api.group.batchupdate + 'access_token=' + data.access_token;
					options.openid_list = openids
				}else {
					var url = api.group.move + 'access_token=' + data.access_token;
					options.openid = openids
				}

				var urlData ={
					method : 'POST',
					url : url,
					json : true,
					body:options

				};

				request(urlData).then(function (response) {
					var _data = response.body;

					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('move')
					}
				})
			})
	})
};

Weichat.prototype.delGroup = function (id) {

	var that = this;


	return new Promise(function (resolve,reject) {
		that
			.fetchAccessToken()
			.then(function (data) {

				var url = api.group.del + 'access_token=' + data.access_token;
				var options ={
					group:{
						id:id
					}
				};

				var urlData ={
					method : 'POST',
					url : url,
					json : true,
					body:options

				};

				request(urlData).then(function (response) {
					var _data = response.body;

					console.log(_data);
					if(_data){
						resolve(_data);
					}else {
						throw new Error('del')
					}
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