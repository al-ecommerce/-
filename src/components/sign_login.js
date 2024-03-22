
import { Link } from "react-router-dom";

import Sell from "../pages/sell";



var readonly={
    padding:"2px 3px",
    width:"100%",
    border:"none"
}


var path="http://localhost:3001/account";

function PostSign(){



    var email= document.getElementById("email").value;
    var username=document.getElementById("username").value;
    var passkey=document.getElementById("passkey").value;

if(passkey.length >=8){
     fetch(path, {
        method:"POST",
        body:JSON.stringify({
            "username":username,
            "email":email,
            "passkey":passkey
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
            
        document.getElementById("signup").style.display="none"
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
            var log_username=document.getElementById("usernam").value;
            var log_pass=document.getElementById("logp").value;
   
localStorage.setItem("usernam", log_username);
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
            var log_username=document.getElementById("usernam").value;
            var log_pass=document.getElementById("logp").value;
   
            if(log_pass === data[i].passkey && log_username === data[i].username){
                document.getElementById("signuplogin").style.display="none";
               
                document.getElementById("sellpage").style.display="block";
                
                document.getElementById("loginemail").value=data[i].email;
                document.getElementById("wlcm").innerHTML=data[i].username;
                
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



export default function SignLog(){
   

    return(
        <div>
        <section onLoad={()=>{document.getElementById("usernam").value=localStorage.getItem("usernam");document.getElementById("check").checked=localStorage.getItem("checking");document.getElementById("logp").value=localStorage.getItem("passk")}} className="containerS" id="signuplogin">
            <div className="formpage login" id="login">
                <Link to="/">
            <a style={{fontSize:"20px",cursor:"pointer"}}>&times;</a>
            </Link>
                <div className="form-content">
                    <header>Login</header>
                    <form action="#" className="form" onSubmit={LogInto}>
                    <input style={readonly} id="loginread" readOnly/>
                     
                        <div className="field input-field">
                            <input type="text" placeholder="Username"  id="usernam" className="input" required/>
                        </div>

                        <div className="field input-field">
                            <input type="password" placeholder="Password" id="logp" className="password" required/>
                            <i className='bx bx-hide eye-icon'></i>
                        </div>

                        <div className="form-link">
                            <a href="#" className="forgot-pass">Forgot password?</a>
                           
                        </div>

                        <div className="form-link">
                        <input type="checkbox" id="check" /><label htmlFor="check">Remember me</label>
                           
                        </div>

                        <div className="field button-field">
                            
                            <button>Login</button>
                            
                        </div>
                    </form>

                    <div className="form-link">
                        <span>Don't have an account? <a href="#" className="link signup-link" onClick={()=>{document.getElementById("signup").style.display="block"}}>Signup</a></span>
                    </div>
                </div>

                <div className="line"></div>

               

                <div className="media-options">
                    <a href="#" className="field google">
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
                    <form action="#" className="form" onSubmit={PostSign}>
                        
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
                        <span>Already have an account? <a href="#" className="link login-link" onClick={()=>{document.getElementById("signup").style.display="none"}}>Login</a></span>
                    </div>
                </div>

                <div className="line"></div>

                
                <div className="media-options">
                    <a href="#" className="field google">
                        <img src={require("../img/google.png")} alt="" className="google-img" />
                        <span>Login with Google</span>
                    </a>
                </div>

            </div>
        </section>

<div style={{display:"none"}} id="sellpage">
    <Sell />
</div>
        </div>
    )
}