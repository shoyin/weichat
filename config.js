/**
 * Created by hoyin on 2017/5/11.
 */
var path = require('path');
var util = require('./libs/util');
var weichat_file = path.join(__dirname,'./config/weichat.txt');

var config = {
	weichat:{
		appID:'wx9d29d627b10b81b0',
		appSecret:'6d673f67941358c2bc8c81ad153d8c75',
		token:'123456789',
		getAccessToken:function () {
			return util.readFileAsync(weichat_file,'utf-8');
		},
		saveAccessToken:function (data) {
			data =JSON.stringify(data);
			return util.writeFileAsync(weichat_file,data);
		}
	}
};

module.exports =config;