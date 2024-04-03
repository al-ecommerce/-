
import { Link } from "react-router-dom";

import Sell from "../pages/sell";



var readonly={
    padding:"2px 3px",
    width:"100%",
    border:"none"
}


var path="https://faint-dandelion-lilac.glitch.me/account";

function PostSign(){



    var email= document.getElementById("email").value;
    var username=document.getElementById("username").value;
    var passkey=document.getElementById("passkey").value;
 var d=new Date();
 var time=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
 var id = Date.now().toString(36) + Math.random().toString(36).substr(2);

if(passkey.length >=8){
     fetch(path, {
        method:"POST",
        body:JSON.stringify({
            "id":id,
            "username":username,
            "email":email,
            "passkey":passkey,
            "notice":"",
            "date":time
        }),
        headers:{
            "Content-type":"application/json"
        }
     })
     .then(res => res.json())
     .then(data => {
        console.log(data)
        document.getElementById("email").value=null;
        document.getElementById("username").value=null;
        document.getElementById("passkey").value=null;
    

        setTimeout(()=>{
            document.getElementById("signupread").value=null;
            
        document.getElementById("signup").style.display="none";
        
        document.getElementById("login").style.display="block"
        },3000)

            document.getElementById("signupread").value="Success! Login"
            document.getElementById("signupread").style.color="green"
     
    })
     .catch(err => console.log(err))
}

else{
    setTimeout(()=>{
        document.getElementById("signupread").value=null;
    },3000)

        document.getElementById("signupread").value="password at least 8 characters"
        document.getElementById("signupread").style.color="red"
 
}

    }
   


    function Refer(){
        fetch(path)
        .then(res => res.json())
        .then(data=> checkData(data))
        .catch(err => console.log(err))
    }

    function checkData(data){

        for(var i=0; i< data.length; i++){
            var email=document.getElementById("email").value;

            if(email === data[i].email){
                document.getElementById("email").value=null;
                
            setTimeout(()=>{
                document.getElementById("signupread").value=null;
            },3000)

                document.getElementById("signupread").value="email already exist"
                document.getElementById("signupread").style.color="red"
            }
        }
    }

    function LogInto(){

        var check=document.getElementById("check");

        if(check.checked == true){
            var log_email=document.getElementById("emaill").value;
            var log_pass=document.getElementById("logp").value;
   
localStorage.setItem("emaill", log_email);
localStorage.setItem("passk",log_pass);
localStorage.setItem("checking", check.checked)

   }

        else{
            localStorage.removeItem("usernam");
            localStorage.removeItem("passk");
            localStorage.removeItem("checking");
        }
     fetch(path)
     .then(res=>res.json())
     .then(data => apppendData(data))
     .catch(err => console.log(err))
    }

    function apppendData(data){
        for(var i=0; i < data.length; i++){
            var log_email=document.getElementById("emaill").value;
            var log_pass=document.getElementById("logp").value;
   
            if(log_pass === data[i].passkey && log_email === data[i].email){
                document.getElementById("signuplogin").style.display="none";
               
                document.getElementById("sellpage").style.display="block";
                
                document.getElementById("loginemail").value=data[i].email;
                document.getElementById("wlcm").innerHTML=data[i].username;
                
                document.getElementById("notice").innerHTML=data[i].notice;
                

                if(data[i].notice === ""){
                    document.getElementById("notice_brd").style.display="none"
                }
                
            }

            else{
                    
            setTimeout(()=>{
                document.getElementById("loginread").value=null;
            },3000)

                document.getElementById("loginread").value="invalid username or password"
                document.getElementById("loginread").style.color="red"
            
            }
           }
    }


function PatchPs(){
    var accoid=document.getElementById("account_id").value;
    var create_ps=document.getElementById("create_ps").value;
    var compare_ps=document.getElementById("compare_ps").value;

    if(compare_ps == create_ps && create_ps.length >=8){
        fetch(`https://faint-dandelion-lilac.glitch.me/account/${accoid}`,{
            method:"PATCH",
            body: JSON.stringify({
                "passkey":create_ps
            }),
            headers:{
                "Content-type":"application/json"
            }
        })
        .then(res => res.json())
        .then(data=> {
            console.log(data)
        
alert("Password recreated successfully")
    document.getElementById("logp").value=create_ps
  
    
    document.getElementById("forgot").style.display="none";
    document.getElementById("signup").style.display="none"
    document.getElementById("login").style.display="block"
        })
        .catch(err => console.log(err))
    }

    else if(compare_ps !== create_ps){
        document.getElementById("err_msg").value="Password does not match";
        document.getElementById("err_msg").style.color="red";
        setTimeout(()=>{
            document.getElementById("err_msg").value=null;
        },3000)

        
    }
    else if(create_ps.length < 8){
        document.getElementById("err_msg").value="Password must be at least 8 characters";
        document.getElementById("err_msg").style.color="red";
        setTimeout(()=>{
            document.getElementById("err_msg").value=null;
        },3000)

        
    }
}


    function checkacPs(){
        document.getElementById("create_ps").value=null
        document.getElementById("compare_ps").value=null;
    
        document.getElementById("forgot").style.display="block";
        document.getElementById("signup").style.display="none"
        document.getElementById("login").style.display="none"
     fetch(path)
     .then(res=>res.json())
     .then(data => apppendPs(data))
     .catch(err => console.log(err))
    }

    function apppendPs(data){
        for(var i=0; i < data.length; i++){
            var log_email=document.getElementById("emaill").value;
            var log_pass=document.getElementById("logp").value;
   
            if(log_email === data[i].email){
              document.getElementById("account_id").value=data[i].id;
            }

           
           }
    }



export default function SignLog(){
   

    return(
        <div>
        <section onLoad={()=>{document.getElementById("emaill").value=localStorage.getItem("emaill");document.getElementById("check").checked=localStorage.getItem("checking");document.getElementById("logp").value=localStorage.getItem("passk")}} className="containerS" id="signuplogin">
            <div className="formpage login" id="login">
                <Link to="/">
            <a style={{fontSize:"20px",cursor:"pointer"}}>&times;</a>
            </Link>
                <div className="form-content">
                    <header>Login</header>
                    <form className="form" onSubmit={LogInto}>
                    <input style={readonly} id="loginread" readOnly/>
                     
                        <div className="field input-field">
                            <input type="email" placeholder="Email"  id="emaill" className="input" required/>
                        </div>

                        <div className="field input-field">
                            <input type="password" placeholder="Password" id="logp" className="password" required/>
                            <i className='bx bx-hide eye-icon'></i>
                        </div>

                        <div className="form-link">
                            <a  className="forgot-pass" onClick={checkacPs}>Forgot password?</a>
                           
                        </div>

                        <div className="form-link">
                        <input type="checkbox" id="check" /><label htmlFor="check">Remember me</label>
                           
                        </div>

                        <div className="field button-field">
                            
                            <button type="submit">Login</button>
                            
                        </div>
                    </form>

                    <div className="form-link">
                        <span>Don't have an account? <a  className="link signup-link" onClick={()=>{document.getElementById("signup").style.display="block";document.getElementById("forgot").style.display="none";document.getElementById("login").style.display="none"}}>Signup</a></span>
                    </div>
                </div>

                <div className="line"></div>

               

                <div className="media-options">
                    <a  className="field google">
                        <img src={require("../img/google.png")} alt="" className="google-img"/>
                        <span>Login with Google</span>
                    </a>
                </div>

            </div>
            


            <div id="signup" className="formpage signup" style={{display:"none"}}>
            <Link to="/">
            <a style={{fontSize:"20px",cursor:"pointer"}}>&times;</a>
            </Link>
                <div className="form-content">
                    <header>Signup</header>
                    <form  className="form" onSubmit={PostSign}>
                        
                    <input style={readonly} id="signupread" readOnly/>
                        <div className="field input-field">
                            <input type="text" placeholder="Username"  id="username" className="input" required/>
                        </div>

                        <div className="field input-field">
                            <input type="email" placeholder="email" id="email"  onKeyDown={Refer} onBlur={Refer} required/>
                        </div>

                        <div className="field input-field">
                            <input type="password" placeholder="Create password at least 8 characters" id="passkey" className="password" />
                        </div>

                        <div className="field button-field">
                            
                            <button id="signB">Signup</button>
                            
                        </div>
                    </form>

                    <div className="form-link">
                        <span>Already have an account? <a  className="link login-link" onClick={()=>{document.getElementById("signup").style.display="none";document.getElementById("login").style.display="block";document.getElementById("forgot").style.display="none"}}>Login</a></span>
                    </div>
                </div>

                <div className="line"></div>

                
                <div className="media-options">
                    <a  className="field google">
                        <img src={require("../img/google.png")} alt="" className="google-img" />
                        <span>Login with Google</span>
                    </a>
                </div>

            </div>

            <div id="forgot" className="formpage" style={{display:"none"}}>
            <Link to="/">
            <a style={{fontSize:"20px",cursor:"pointer"}}>&times;</a>
            </Link>
                <div className="form-content">
                    <header>Forgot Password</header>
                    <form  className="form" onSubmit={PatchPs}>
                        
                    <input style={readonly} id="err_msg" readOnly/>
                    <input style={{padding:"2px 3px",display:"none",width:"100%",border:"none"}} id="account_id" readOnly/>
                        
                        <div className="field input-field">
                            <input type="password" placeholder="Create password" id="create_ps" required/>
                        </div>

                        <div className="field input-field">
                            <input type="password" placeholder="Confirm password" id="compare_ps" className="password" required/>
                        </div>

                        <div className="field button-field">
                            
                            <button >Change Password</button>
                            
                        </div>
                    </form>

                    <div className="form-link">
                        <span>Don't have an account? <a  className="link signup-link" onClick={()=>{document.getElementById("signup").style.display="block";document.getElementById("forgot").style.display="none";document.getElementById("login").style.display="none"}}>Signup</a></span>
                    </div>
                </div>

                <div className="line"></div>

                
               

            </div>

            
        </section>

<div style={{display:"none"}} id="sellpage">
    <Sell />
</div>
        </div>
    )
}