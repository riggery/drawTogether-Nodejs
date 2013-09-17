function onSocketConnected(){
    console.log('hi');
}

var myDiv = $("#chat_slider");
myDiv.animate({ scrollTop: myDiv.attr("scrollHeight") - myDiv.height() }, 3000);

function timer(){
    var s = 60; 
    document.write('<span><font id="f_ss">' + s + '</font>second</span>'); 
    var timeInterval = setInterval(function () { 
        if (s == 0) { 
            clearInterval(timeInterval);
            alert('Time Out') 
            return; 
        } 
        s -= 1; 
        document.getElementById('f_ss').innerHTML = s; 
    }, 1000); 
}



window.onload=function(){
    var paint={
        init:function()
        {
            this.load();
            this.eventHandlers();
            
        },
        load:function()
        {   
            this.x=[];//记录鼠标移动是的X坐标
            this.y=[];//记录鼠标移动是的Y坐标
            this.clickDrag=[];
            this.lock=false;//鼠标移动前，判断鼠标是否按下
            this.isEraser=false;
            //this.Timer=null;//橡皮擦启动计时器
            //this.radius=5;
            this.storageColor="#000000";
            this.eraserRadius=15;//擦除半径值
            this.color=["#000000","#FF0000","#80FF00","#00FFFF","#808080","#FF8000","#408080","#8000FF","#CCCC00"];//画笔颜色值
            this.fontWeight=[2,5,8];
            this.$=function(id){return typeof id=="string"?document.getElementById(id):id;};
            this.canvas=this.$("canvas");
            if (this.canvas.getContext) {
            } else {
                alert("Browser doesn't support canvas");
                return;
            }
            this.cxt=this.canvas.getContext('2d');
            this.cxt.lineJoin = "round";//context.lineJoin - 指定两条线段的连接方式
            this.cxt.lineWidth = 5;//线条的宽度
            this.iptClear=this.$("clear");
            this.revocation=this.$("revocation");
            this.imgurl=this.$("imgurl");//图片路径按钮
            this.w=this.canvas.width;//取画布的宽
            this.h=this.canvas.height;//取画布的高 
            this.touch =("createTouch" in document);//判定是否为手持设备
            this.StartEvent = this.touch ? "touchstart" : "mousedown";//支持触摸式使用相应的事件替代
            this.MoveEvent = this.touch ? "touchmove" : "mousemove";
            this.EndEvent = this.touch ? "touchend" : "mouseup";
            this.bind();
        },
        bind:function()
        {
            var t=this;
            /*清除画布*/
            this.iptClear.onclick=function()
            {   
                alert('clear');
                socket.emit("draw clear", {});
                t.clear();
            };
            /*鼠标按下事件，记录鼠标位置，并绘制，解锁lock，打开mousemove事件*/
            this.canvas['on'+t.StartEvent]=function(e)
            {   
                var touch=t.touch ? e.touches[0] : e; 
                var _x=touch.clientX - touch.target.offsetLeft-210;//鼠标在画布上的x坐标，以画布左上角为起点
                var _y=touch.clientY - touch.target.offsetTop-130;//鼠标在画布上的y坐标，以画布左上角为起点             
                if(t.isEraser)
                {
                    socket.emit("draw start", {x: _x, y: _y, ifErase:true});
                    t.resetEraser(_x,_y);
                }else
                {   
                    //socket.emit("draw move", {x: _x, y: _y});
                    socket.emit("draw start", {x: _x, y: _y, ifErase:false});
                    t.movePoint(_x,_y);//记录鼠标位置
                    t.drawPoint();//绘制路线
                }
                t.lock=true;
            };
            /*鼠标移动事件*/
            this.canvas['on'+t.MoveEvent]=function(e)
            {
                var touch=t.touch ? e.touches[0] : e;
                if(t.lock)//t.lock为true则执行
                {

                    //console.log(touch.target.offsetTop);
                    var _x=touch.clientX - touch.target.offsetLeft-210;//鼠标在画布上的x坐标，以画布左上角为起点
                    var _y=touch.clientY - touch.target.offsetTop-130;//鼠标在画布上的y坐标，以画布左上角为起点
                    if(t.isEraser)
                    {       
                        socket.emit("draw move", {x: _x, y: _y, ifErase:true});
                        t.resetEraser(_x,_y);
                    }
                    else
                    {
                        //console.log(_x+" "+_y);
                        socket.emit("draw move", {x: _x, y: _y, ifErase:false});
                        t.movePoint(_x,_y,true);//记录鼠标位置
                        t.drawPoint();//绘制路线
                    }
                }
            };

            this.canvas['on'+t.EndEvent]=function(e)
            {
                socket.emit("draw end", {});
                /*重置数据*/
                t.lock=false;
                t.x=[];
                t.y=[];
                t.clickDrag=[];
                clearInterval(t.Timer);
                t.Timer=null;
                
            };
            this.revocation.onclick=function()
            {
                //alert('clicked');
                t.redraw();
            };
            this.changeColor();
            this.imgurl.onclick=function()
            {
                t.getUrl();
            };
            /*橡皮擦*/
            this.$("eraser").onclick=function(e)
         {
             t.isEraser=true;
                t.$("error").style.color="red";
                t.$("error").innerHTML="You are using eraser！";
         };
        },
        movePoint:function(x,y,dragging)
        {   
            /*将鼠标坐标添加到各自对应的数组里*/
            this.x.push(x);
            this.y.push(y);
            this.clickDrag.push(y);
            //console.log(this.clickDrag);
            //socket.emit("draw move", {x: this.x, y: this.y});
        },
        drawPoint:function(x,y,radius)
        {
            for(var i=0; i < this.x.length; i++)//循环数组
            {   
                this.cxt.beginPath();//context.beginPath() , 准备绘制一条路径
                
                if(this.clickDrag[i] && i){//当是拖动而且i!=0时，从上一个点开始画线。
                    this.cxt.moveTo(this.x[i-1], this.y[i-1]);//context.moveTo(x, y) , 新开一个路径，并指定路径的起点
                }else{
                    this.cxt.moveTo(this.x[i]-1, this.y[i]);
                }
                this.cxt.lineTo(this.x[i], this.y[i]);//context.lineTo(x, y) , 将当前点与指定的点用一条笔直的路径连接起来
                this.cxt.closePath();//context.closePath() , 如果当前路径是打开的则关闭它
                this.cxt.stroke();//context.stroke() , 绘制当前路径
            }
        },
        clear:function()
        {
            this.cxt.clearRect(0, 0, this.w, this.h);//清除画布，左上角为起点
        },
        redraw:function()
        {  
            /*撤销*/
            this.cxt.restore();  
            
        },  
        preventDefault:function(e){
            /*阻止默认*/
            var touch=this.touch ? e.touches[0] : e;
          if(this.touch)touch.preventDefault();
          else window.event.returnValue = false;
        },
        changeColor:function()
        {
             /*为按钮添加事件*/
             var t=this,iptNum=this.$("color").getElementsByTagName("input"),fontIptNum=this.$("font").getElementsByTagName("input");
             for(var i=0,l=iptNum.length;i<l;i++)
             {
                 iptNum[i].index=i;
                 iptNum[i].onclick=function()
                 {
                     socket.emit("change color", {index:this.index});
                     t.cxt.save();
                     t.cxt.strokeStyle = t.color[this.index];
                     t.storageColor=t.color[this.index];
                     t.$("error").style.color="#000";
                     t.$("error").innerHTML="如果有错误，请使用橡皮擦：";
                     t.cxt.strokeStyle = t.storageColor;
                     t.isEraser=false;
                 }
             }
             for(var i=0,l=fontIptNum.length;i<l;i++)
             {
                 t.cxt.save();
                 fontIptNum[i].index=i;
                 fontIptNum[i].onclick=function()
                 {
                     socket.emit("change font", {index:this.index});
                     t.changeBackground(this.index);
                     t.cxt.lineWidth = t.fontWeight[this.index];
                     t.$("error").style.color="#000";
                     t.$("error").innerHTML="如果有错误，请使用橡皮擦：";
                     t.isEraser=false;
                     t.cxt.strokeStyle = t.storageColor;
                 }
             }
        },
        changeBackground:function(num)
        {
             /*添加画笔粗细的提示背景颜色切换，灰色为当前*/
             var fontIptNum=this.$("font").getElementsByTagName("input");
             for(var j=0,m=fontIptNum.length;j<m;j++)
                {
                    fontIptNum[j].className="";
                    if(j==num) fontIptNum[j].className="grea";
                }
        },
        getUrl:function()
        {
               this.$("html").innerHTML=this.canvas.toDataURL();
        },
        
        //resetEraser:function(_x,_y,touch)
        resetEraser:function(_x,_y)
        {   
             
            /*使用橡皮擦-提醒*/
            var t=this;
            //this.cxt.lineWidth = 30;
            /*source-over 默认,相交部分由后绘制图形的填充(颜色,渐变,纹理)覆盖,全部浏览器通过*/
            t.cxt.globalCompositeOperation = "destination-out";
            t.cxt.beginPath();
            t.cxt.arc(_x, _y, t.eraserRadius, 0, Math.PI * 2);
            t.cxt.strokeStyle = "rgba(250,250,250,0)";
            t.cxt.fill();
            t.cxt.globalCompositeOperation = "source-over"
        },
        eventHandlers:function()
        {


        //Room Name Part   
            // listener, whenever the server emits 'updatechat', this updates the chat body
            socket.on('updatechat', function (username, data) {
                $('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
            });


            socket.on('updateuser', function (data) {
                //console.log(data.userlist);
                var userlist=data.userlist;

                var output="";
                $.each(userlist, function(key, val) {
                   //alert(val);
                   output += '<li class="common">' +val +'</li>';
                });


                //var output=""; 
                // if(data.roomhost==true){
                //     $.each(data, function(key, val) {
                //         if(key=="userlist"){
                //             output += '<li class="roomhost">' +val +'</li>';
                //         }
                //     });
                // }
                // else{
                //     $.each(data.userlist, function(key, val) {
                        //if(key=="userlist"){
                          //  output += '<li class="common">' +val +'</li>';
                        //}
                   // });
                //}
                $('#player_list').empty();
                $('#player_list').append(output);
            });




            socket.on('updaterooms', function(rooms, current_room) {
                $('#rooms').empty();
                $.each(rooms, function(key, value) {
                    if(value == current_room){
                        $('#rooms').append('<div>' + value + '</div>');
                    }
                    else {
                        $('#rooms').append('<div><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>');
                        //$('#rooms').append('<div><input type="button" id="room_num" value=\''+value+'\' /></div>');
                        //$('#rooms').append('<a id=\''+value+'\' href="#">' + value + '</a>');

                    }
                });
            });

            $("#rooms").on('click', function(){ 
                alert($(this).attr('id'));
            });

       

            function switchRoom(){
                alert('daaa');
                //socket.emit('switchRoom', room);
            }
                

            $(function(){
                // when the client clicks SEND
                $('#datasend').click( function() {
                    var message = $('#data').val();
                    $('#data').val('');
                    // tell server to execute 'sendchat' and send along one parameter
                    socket.emit('sendchat', message);
                });

                // when the client hits ENTER on their keyboard
                $('#data').keypress(function(e) {
                    if(e.which == 13) {
                        $(this).blur();
                        $('#datasend').focus().click();
                    }
                });
            });






        //Drawing Pad Part
            //draw Part
            var t=this;
            socket.on("connect", function(){
                //alert('hello')
                socket.emit('adduser', prompt("What's your name?"));
            });




            socket.on('draw move', function(data) {
                //console.log(data.x+data.y);
                //console.log(t);
                //this.draw();
                console.log(data.ifErase);
                if(data.ifErase==true){
                        console.log("erase");
                        t.resetEraser(data.x,data.y);
                }
                else{
                    t.movePoint(data.x,data.y,true)
                    t.drawPoint();
                }

            });

             socket.on('draw start', function(data) {
                //console.log(data.x+data.y);
                //console.log(t);
                //this.draw();
                console.log(data.ifErase);
                if(data.ifErase=="true"){
                      t.resetEraser(data.x,data.y);
                }
                else{
                    t.movePoint(data.x,data.y,true)
                    t.drawPoint();
                }
            });

            socket.on('draw end', function(data) {
                t.lock=false;
                t.x=[];
                t.y=[];
                t.clickDrag=[];
                clearInterval(t.Timer);
                t.Timer=null;
            });

            socket.on('change font', function(data) {
                 t.changeBackground(data.index);
                 t.cxt.lineWidth = t.fontWeight[data.index];
                 t.$("error").style.color="#000";
                 t.$("error").innerHTML="如果有错误，请使用橡皮擦：";
                 t.isEraser=false;
                 t.cxt.strokeStyle = t.storageColor;
            });


            socket.on('change color', function(data) {
                 t.cxt.save();
                 t.cxt.strokeStyle = t.color[data.index];
                 t.storageColor=t.color[data.index];
                 t.$("error").style.color="#000";
                 t.$("error").innerHTML="如果有错误，请使用橡皮擦：";
                 t.cxt.strokeStyle = t.storageColor;
                 t.isEraser=false;
            });

            socket.on('draw clear', function(data) {
                t.clear();
            });
        }
        
    };
    paint.init();
};
