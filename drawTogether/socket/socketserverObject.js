var io = require('socket.io').listen(3000);
exports.io=io;
var db=require('./database.js');


// Listen for client connection event
// io.sockets.* is the global, *all clients* socket
// For every client that is connected, a separate callback is called


// usernames which are currently connected to the chat
//var usernames = {};
var usernames = [];

var currentdrawer = "";

// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];


io.sockets.on('connection', function(socket){
	
	// Listen for this client's "send" event
	// remember, socket.* is for this particular client
	//console.log(socket.id)
	//socket.emit('draw move', { success: 'false', identity:'User', info: 'Wrong Admin Password'});
	/////////// REGISTER AND LOGIN ISSUE///////////////////////////////////////////////

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		// add the client's username to the global list
		usernames[usernames.length] = username;
		//console.log(usernames.length);
		//console.log(usernames);
		// send client to room 1
		socket.join('room1');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');

		//Broadcast to all people in room except youself
		//socket.broadcast.to('room1').emit('updateuser', {userlist:usernames});

		//Broadcast to all people in room include youself
        if(usernames.length==1){
			io.sockets.in('room1').emit('updateuser', {roomhost:true, userlist:usernames});
        }
        else{
        	io.sockets.in('room1').emit('updateuser', {roomhost:false, userlist:usernames});
        }


	});


	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});
	


		// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});


	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		//delete usernames[socket.username];
		usernames=deleteFromList(usernames,socket.username);
		console.log(usernames);
		// update list of users in chat, client-side
		//io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
		//console.log(usernames)
		io.sockets.in('room1').emit('updateuser', {roomhost:false, userlist:usernames});
		//io.sockets.in('room1').emit({roomhost:false, userlist:usernames});
	});


	////////////LOGIN PART//////////////////////////////////////////
	socket.on('validAdmin',function(msg){
		var record= {content:[{email:msg.email, username:msg.username, id:msg.id, pwd:msg.pwd}]}
		
		db.openDb(ifExist,"user",{$or:[{email:msg.email},{username:msg.username}]},record)
	});

	////////////VALIDATION LOGIN //////////////////////////////////////////
	socket.on('validLogin',function(msg){
			db.openDb(loginCheck,'user',{id:msg.email},{pwd:msg.pwd});
	});
	
	

	/////////// ITEMS OPERATION ///////////////////////////////////////////////////////
	socket.on('insertItem', function(msg) {
		console.log('on server listenInsert');
		db.openDb(db.insertDocuments,msg.collection,msg.content,{});
		
	});
	
	
	socket.on('removeItem', function(msg) {
		db.openDb(db.removeDoc,msg.collection,msg.content,{});
	});

	
	socket.on('findItem', function(msg) {
		console.log('on server listenFind');
		db.openDb(findDoc,msg.collection,msg.content,msg.extraMsg);
		//console.log(db.result);
	});

	socket.on('updateItem', function(msg) {
		console.log('on server listenUpdate');
		db.openDb(getSpecificValue,msg.collection,msg.content,msg.replace);
		//console.log(db.result);
	});
	
	
	socket.on('insertpullItem', function(msg) {
		console.log('on server listenUpdate');
		db.openDb(updateDoc,msg.collection,msg.content,msg.replace);
		//console.log(db.result);
	});




	////////////DRAW PAD PART/////////////////////////////////////////////
	socket.on('draw move',function(msg){
		//console.log(this.id);
		//console.log(msg.x+" "+msg.y);
		console.log(msg.ifErase);
		this.broadcast.emit('draw move', {x:msg.x,y:msg.y,ifErase:msg.ifErase});
	});

	socket.on('draw start',function(msg){
		//console.log(this.id);
		//console.log(msg.x+" "+msg.y);
		verbGen();
		console.log(msg.ifErase);
		this.broadcast.emit('draw start', {x:msg.x,y:msg.y,ifErase:msg.ifErase});

	});

	socket.on('draw end',function(msg){
		console.log(this.id);
		//console.log(msg.x+" "+msg.y);
		this.broadcast.emit('draw end', {});
	});

	socket.on('draw clear',function(msg){
		//console.log(this.id);
		//console.log(msg.x+" "+msg.y);
		this.broadcast.emit('draw clear', {});
	});

	socket.on('change font',function(msg){
		//console.log(this.id);
		console.log(msg.index);
		this.broadcast.emit('change font', {index:msg.index});
	});

	socket.on('change color',function(msg){
		//console.log(this.id);
		//console.log(msg.index);
		this.broadcast.emit('change color', {index:msg.index});

	});




//========================================
//         Check if existed
//========================================
function ifExist(collection,query,extraMsg,done){
    collection.find(query).toArray(function(error, result){
    if (error)
        throw error;
    if (result.length!=0) {
        io.sockets.socket(socket.id).emit('ifexist', {status:'existed'});
    }
    else{
		io.sockets.socket(socket.id).emit('validPass', {status:'success', content:extraMsg.content});
    }
    db.closeDb();
    });
}


//========================================
//         Log in Checked
//========================================
function loginCheck(collection,query,extraMsg,done){
    //extraMsg.levelconsole.log(extraMsg.level);
    collection.find(query).toArray(function(error, result){
    if (error)
        throw error;
    if (result.length==0) {
       console.log("The Email doesn't exist! Register Please")
       io.sockets.socket(socket.id).emit('loginPass', {status:'register',username:''});
    }
    else{
	    if(result[0].pwd==extraMsg.pwd){
			var username=result[0].username;
			io.sockets.socket(socket.id).emit('loginPass', {status:'login',username:username});
	    }
	    else{
			io.sockets.socket(socket.id).emit('loginPass', {status:'wrongpwd',username:''});
	    }
    }
    db.closeDb();
    });
}




//========================================
//         find a document
//========================================
function findDoc(collection,query,extraMsg,done){
    console.log(extraMsg.level);
    console.log(extraMsg.msg)
    collection.find(query).toArray(function(error, result){
    if (error)
        throw error;
    //console.log('hellooooooooooooooooooooo')
    //console.log(result.length);
    if (extraMsg.msg=='list' && extraMsg.level=='Admin') {
	//console.log('hellooooooooooooooooooooo')
	for(var i=0; i<result.length; i++){
	    io.sockets.emit('admintoolList', result[i]);
	}
    }
    else if (extraMsg.msg=='list' && extraMsg.level=='User') {
	//console.log('helloooooo user tool list ooooooooooooooo')
	for(var i=0; i<result.length; i++){
	    io.sockets.emit('usertoolList', result[i]);
	}
    }
    else if (extraMsg.msg=='detail' && extraMsg.level=='User') {
	for(var i=0; i<result.length; i++){
	    io.sockets.emit('userdetailInfo', result[i]);
	}
    }
    else if (extraMsg.msg=='detail' && extraMsg.level=='Admin') {
	for(var i=0; i<result.length; i++){
	    io.sockets.emit('admindetailInfo', result[i]);
	}
    }
    else if (extraMsg.msg=='msglist') {
	//console.log('one or two')
	for(var i=0; i<result.length; i++){
	    io.sockets.emit('msgList', result[i]);
	}
    }
    
    
    
    db.closeDb();
    });
}





//================================================
//         get Pick && Return Date Already stored
//===============================================
function getSpecificValue(collection,query,extraMsg,done){
    collection.find(query,extraMsg).toArray(function(error, result){
	if (error)
	    throw error;
	for(var i=0; i<result.length; i++){
		console.log('=======')
		//console.log(result[i])
		io.sockets.socket(socket.id).emit('prDatePass', result[i]);
	}
	 db.closeDb();
	});
}







//======================================
//      updating a document
//======================================

function updateDoc(collection,query,extraMsg,done){
	console.log('update is called')    
    //var query = { n: 3 };
    //var replacement = { x: 135 };
    var replacement=extraMsg;
    collection.update(query, replacement, function checkError(error){
        if (error)
            throw error;
        console.log('document updated!');
        db.closeDb();
    });
}


});



function deleteFromList(array,deleteItem){
	var index = array.indexOf(deleteItem);
	array.splice(index, 1);
	return array;
}




//======================================
//      verb Base
//======================================
function verbGen(){
	var randomnumber=Math.floor(Math.random()*verb.length-1);
	var randomverb=verb[randomnumber];
	console.log(randomverb);
}

var verb =["白鸽",
"贝迷",
"布娃娃",
"餐巾",
"仓库",
"CD",
"瓷器",
"长江三峡",
"长颈漏斗",
"赤壁",
"除草剂",
"大树",
"大头鱼",
"刀",
"冬瓜",
"豆沙包",
"耳",
"耳机",
"飞碟",
"工资",
"荷花",
"烘干机",
"虎",
"蝴蝶",
"护膝",
"花朵",
"环保",
"欢乐谷",
"击剑",
"监狱",
"教师",
"结婚证",
"狙击步枪",
"空格键",
"KTV",
"篮球架",
"老爷车",
"刘翔",
"落地灯",
"棉花",
"母亲",
"NBA",
"内裤",
"牛奶糖",
"牛肉干",
"牛肉面",
"排插",
"秦始皇兵马俑",
"全家桶",
"沙僧",
"圣经",
"升旗",
"实验室",
"狮子座",
"守门员",
"首饰",
"手套",
"水波",
"土豆",
"丸子",
"网址",
"鲜橙多",
"鲜花",
"小霸王",
"腰带",
"烟斗",
"扬州炒饭",
"衣橱",
"医生",
"音响",
"鹦鹉",
"油",
"语文书",
"针筒",
"纸杯",
"钻戒",
];



