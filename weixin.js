/**
 * Created by hoyin on 2017/5/11.
 */
'use strict';
var config = require('./config');
var Weichat = require('./weichat/weichat');
var weichatApi = new Weichat(config.weichat);
exports.reply =function* (next) {
	var message = this.weixin;
	if(message.MsgType === 'event'){
		
		console.log(message);
		if(message.Event === 'subscribe'){
			if(message.EventKey){
				console.log('扫码' +message.EventKey + ' ' + message.ticket );
			}
			this.body = '订阅\r\n' + '消息ID:';
		}else if(message.Event === 'unsubscribe'){
			console.log('取消关注');
			this.body = ''
		}else if(message.Event === 'LOCATION'){
			this.body = '位置' + message.Latitude + '/' + message.Longitude + '-' + message.Precision
		}else if(message.Event === 'CLICK'){
			this.body = '菜单' + message.EventKey;
		}else if(message.Event === 'SCAN'){
			console.log('shaoma' + message.EventKey + '  ' + message.Ticket);
			this.body = '扫码';
		}else if(message.Event === 'VIEW'){
			this.body = '连接' + message.EventKey ;
		}
	}else if(message.MsgType === 'text'){

		var content = message.Content;
		var reply = '你说的   ' + content + '太复杂';
		if( content === '1'){
			reply = '大码';
		}
		else if( content === '2'){
			reply = '大码';
		}
		else if( content === '4'){

			reply = [{
				title : 'xxxx',
				description : 'xxx',
				picUrl : 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1495103418&di=af10ea63537b591dba6e15072712cb84&imgtype=jpg&er=1&src=http%3A%2F%2Fimgsrc.baidu.com%2Fforum%2Fpic%2Fitem%2Fcefc1e178a82b9017ad72597738da9773912ef18.jpg',
				url:'www.baidu.com'
				},
				{
					title : 'ssssssssss',
					description : 'xxx',
					picUrl : 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1495103418&di=af10ea63537b591dba6e15072712cb84&imgtype=jpg&er=1&src=http%3A%2F%2Fimgsrc.baidu.com%2Fforum%2Fpic%2Fitem%2Fcefc1e178a82b9017ad72597738da9773912ef18.jpg',
					url:'www.baidu.com'
				}
			]
		}
		else if( content === '5'){
			var data = yield weichatApi.uploadMaterial('image',__dirname + '/2.jpg');
			reply = {
				type :'image',
				mediaId:data.media_id
			}
		}
		else if( content === '6'){
			var data = yield weichatApi.uploadMaterial('video',__dirname + '/6.mp4');
			reply = {
				title:'xxxxxx',
				description:'xxxxxx',
				type :'video',
				mediaId:data.media_id
			}
		}

		else if( content === '7'){
			var data = yield weichatApi.uploadMaterial('image',__dirname + '/2.jpg');
			reply = {
				title:'xxxxxx',
				description:'xxxxxx',
				type :'music',
				musicUrl:'http://sc1.111ttt.com/2015/1/05/20/98201126418.mp3',
				thumbMediaId:data.media_id
			}
		}
		else if( content === '8'){
			var data = yield weichatApi.uploadMaterial('image',__dirname + '/2.jpg',{type:'image'});
			
			console.log(data);
			reply = [{
				title : content,
				description : content,
				picUrl : data.url,
				url:'www.baidu.com'
			}
			]

		}
		else if( content === '9'){
			var data = yield weichatApi.uploadMaterial('video',__dirname + '/6.mp4',{type:'video',description:'{"title":"xxxxxx","introduction":"xxxxxx"}'});

			reply = {
				title:'xxxxxx',
				description:'xxxxxx',
				type :'video',
				mediaId:data.media_id
			}
		}else {

			var data = yield weichatApi.uploadMaterial('image',__dirname + '/33.jpg',{type:'image'});

			console.log(data);
			reply = [{
				title : content,
				description : content,
				picUrl : data.url,
				url:''
			},
				{
				title : '就是这么动霸歘',
				description : 'xxx',
				picUrl : 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1495103418&di=af10ea63537b591dba6e15072712cb84&imgtype=jpg&er=1&src=http%3A%2F%2Fimgsrc.baidu.com%2Fforum%2Fpic%2Fitem%2Fcefc1e178a82b9017ad72597738da9773912ef18.jpg',
				url:'www.baidu.com'
			}
			]
		}


		this.body = reply;
	}
	yield next
};