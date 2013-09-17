

//////////////////////////////////////////////////////////////////////
////////////////Registeration Validation//////////////////////////////
function empty_validation(content,name){  
var content_len = content.value.length;  
    if (content_len == 0)  
        {  
            alert(name+" must be fill out");  
            content.focus();  
            return false;  
        }  
    return true;  
}  
        
function conpwd(password,cpassword) {
    if (password.value != cpassword.value) { 
       alert("Your password and confirmation password do not match.");
       cpassword.focus();
       return false; 
    }
    return true;
}


function validatePhone(tel) {
   var stripped = tel.value.replace(/[\.\@\!\#\$\%\^\&\*\=\_\|\ ]/g, '');
   if (tel.value == "") {
        error = "You didn't enter a phone number.\n";
        alert(error);
        return false;
    }
    else if (isNaN(parseInt(stripped))) {
        error = "The phone number contains illegal characters.\n";
        alert(error);
        return false;
    }
    else if (!(stripped.length == 10)) {
        error = "The phone number is the wrong length. Make sure you included an area code.\n";
        alert(error);
        return false;
    }
    else{
        return true;
    }
}

function validateEmail(emailadress)
{
var x=emailadress.value;
var atpos=x.indexOf("@");
var dotpos=x.lastIndexOf(".");
if (atpos<1 || dotpos<atpos+2 || dotpos+2>=x.length)
  {
  alert("Not a valid e-mail address");
  return false;
  }
  return true;
}

function formValidation()  
{
    var register_email=document.registeration.register_email;
    var register_username=document.registeration.register_username;
    var register_pwd=document.registeration.register_pwd;
    var confirm_pwd=document.registeration.confirm_pwd;
    

    if(empty_validation(register_email,'Email Address')){
    if(validateEmail(register_email)){
    if(empty_validation(register_username,'Username')){
    if(empty_validation(register_pwd,'Password')){
    if(empty_validation(confirm_pwd,'Confirm Password')){
    if (conpwd(register_pwd,confirm_pwd)){
      return true
    }}}}}}
}


//////////////////////////////////////////////////////////////////////
////////////////LOGIN Validation//////////////////////////////
function loginformValid() {
    var login_email=document.login.login_email;
    var login_pwd=document.login.login_pwd;
   
    if(empty_validation(login_email,'Email Address')){
    if(empty_validation(login_pwd,'Password')){
      return true
    }}
}


//////////////////////////////////////////////////////////////////////
if (document.all){  
    window.attachEvent('onload',login)//IE中
}   
else{   
    window.addEventListener('load',login,false);//firefox   
}


function login(){
    ///////////////////////REGISTER BUTTON EVENT//////////////////////////////////////////
    $('#register_btn').on('click', function() {      
        if(formValidation()){
            var register_email=document.registeration.register_email;
            var register_pwd=document.registeration.register_pwd;
            var confirm_pwd=document.registeration.confirm_pwd;
            socket.emit('validAdmin',{email:register_email.value, username:register_username.value, id:register_email.value, pwd:confirm_pwd.value} ); 
            
        }
    });
    //////////////ALERT EMAIL ALREADY USED///////////////////////////////////////
    socket.on('ifexist', function(data) {
        if (data.status=='existed') {
           alert("The email or username has been used");
        }
    });   
    ///////////////ALERT ADMIN PASSWORD WRONG/////////////////////////////////////
    socket.on('verify_status', function(data) {
        if (data.success=='false') {
            alert(data.info);
        }
    });
    /////////PASS ALL VALIDATION  STORE IN DB NOTIFICATION////////////////////////  
    socket.on('validPass', function(data) {
        if (data.status=='success') {
             record={collection:"user", content:data.content}
             //alert('Congratulation! Register Successfully')
             socket.emit('insertItem', record);
             alert('Congratulation! Register Successfully');
        }
    });
    ////////////////////////////////////////////////////////////////////
    
    
    /////////////////////LOG IN ISSUE////////////////////////////////
    //////////////////// LOGIN BUTTON EVENT//////////////////////////////////////////
    $('#login_btn').on('click', function() {      
        if(loginformValid()){
            //alert('next step')
            var login_email=document.login.login_email;
            var login_pwd=document.login.login_pwd;
            socket.emit('validLogin',{email:login_email.value, pwd:login_pwd.value,level:'Admin'} ); 
        } 
    });
    
    var username="";
    /////////////LISTEN LOGIN RESPONSE/////////////////////////////////////
     socket.on("loginPass", function(data) {
        username=data.username;
        if (data.status=='login') {
            alert("welcome");
           //level='Admin';
           //$.mobile.changePage( "#Entry", { transition: "slideup", changeHash: false });
        }
        else if(data.status=='wrongpwd') {
            alert("Incorrect Email or Wrong Password");
        }
        else{
            alert("The Email doesn't exist! Register Please")
        }
        
    });
};


      