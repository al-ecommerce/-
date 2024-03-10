import { useEffect } from "react";
import { Link } from "react-router-dom";





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
        alert("Signup Successful. LOG IN")
        document.getElementById("signup").style.display="none"
    })
     .catch(err => console.log(err))
}

else{
    document.getElementById("passkey").style.background="red"
}
    }
   

    function LogInto(){
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
               window.location.assign("/sell")
            }
           }
    }

export default function SignLog(){
   

    return(
        <>
        <section class="containerS">
            <div class="formpage login" id="login">
                <Link to="/">
            <a style={{fontSize:"20px",cursor:"pointer"}}>&times;</a>
            </Link>
                <div class="form-content">
                    <header>Login</header>
                    <form action="#" className="form" onSubmit={LogInto}>
                        <div class="field input-field">
                            <input type="text" placeholder="Username"  id="usernam" class="input" required/>
                        </div>

                        <div class="field input-field">
                            <input type="password" placeholder="Password" id="logp" class="password" required/>
                            <i class='bx bx-hide eye-icon'></i>
                        </div>

                        <div class="form-link">
                            <a href="#" class="forgot-pass">Forgot password?</a>
                        </div>

                        <div class="field button-field">
                            
                            <button>Login</button>
                            
                        </div>
                    </form>

                    <div class="form-link">
                        <span>Don't have an account? <a href="#" class="link signup-link" onClick={()=>{document.getElementById("signup").style.display="block"}}>Signup</a></span>
                    </div>
                </div>

                <div class="line"></div>

               

                <div class="media-options">
                    <a href="#" class="field google">
                        <img src={require("../img/google.png")} alt="" class="google-img"/>
                        <span>Login with Google</span>
                    </a>
                </div>

            </div>


            <div id="signup" class="formpage signup" style={{display:"none"}}>
            <Link to="/">
            <a style={{fontSize:"20px",cursor:"pointer"}}>&times;</a>
            </Link>
                <div class="form-content">
                    <header>Signup</header>
                    <form action="#" className="form" onSubmit={PostSign}>
                        <div class="field input-field">
                            <input type="text" placeholder="Username"  id="username" class="input" required/>
                        </div>

                        <div class="field input-field">
                            <input type="email" placeholder="email" id="email" required/>
                        </div>

                        <div class="field input-field">
                            <input type="password" placeholder="Create password at least 8 characters" id="passkey" class="password" />
                        </div>

                        <div class="field button-field">
                            
                            <button id="signB">Signup</button>
                            
                        </div>
                    </form>

                    <div class="form-link">
                        <span>Already have an account? <a href="#" class="link login-link" onClick={()=>{document.getElementById("signup").style.display="none"}}>Login</a></span>
                    </div>
                </div>

                <div class="line"></div>

                
                <div class="media-options">
                    <a href="#" class="field google">
                        <img src={require("../img/google.png")} alt="" class="google-img" />
                        <span>Login with Google</span>
                    </a>
                </div>

            </div>
        </section>

        </>
    )
}