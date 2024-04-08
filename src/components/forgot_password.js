import { Link } from "react-router-dom";

var path="https://faint-dandelion-lilac.glitch.me/account";

var readonly={
    padding:"2px 3px",
    width:"100%",
    border:"none"
}

function fetchEmail(){
    fetch(path)
    .then(res => res.json())
    .then(data=> checkEmail(data))
    .catch(err => console.log(err))
}

function checkEmail(data){

    for(var i=0; i< data.length; i++){
        var email=document.getElementById("fetch_email").value;

        if(email === data[i].email){
            document.getElementById("fid").value=data[i].id;
            document.getElementById("main_content").style.display="block";
            
            document.getElementById("fetch_email").style.display="none";
            
       
        }
        else{
            document.getElementById("fetch_id").value="Invalid email";
            setTimeout(()=>{
                document.getElementById("fetch_id").value=""    
            },3000)
        }
    }

}

function ChngPs(){
    const fid=document.getElementById("fid").value;
    const create_ps=document.getElementById("create_ps").value;
    const confirm_ps=document.getElementById("confirm_ps").value;

    if(confirm_ps == create_ps && create_ps.length >= 8){
    fetch(`https://faint-dandelion-lilac.glitch.me/account/${fid}`,{
        method:"PATCH",
        body:JSON.stringify({
            "passkey":create_ps
        }),
        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
    
      alert("Created Successfully")
            document.location.href="#/sign_login"
       
    })
    .catch(err=> console.log(err))
    }
    else{
        document.getElementById("err_msg").value="Invalid. Password must be at least 8 characters and must match."
    }
}

export default function FP(){
return(
        <>
<section className="containerS" id="signuplogin">
<div className="formpage login" id="login">
                <Link to="/">
            <a style={{fontSize:"20px",cursor:"pointer"}}>&times;</a>
            </Link>
                <div className="form-content">
                    <header>Change Password</header>
                    <form className="form" onSubmit={ChngPs}>
                    <input style={readonly} id="fetch_id" readOnly/>
                     
                        <div className="field input-field">
                            <input type="email" placeholder="Email" onKeyUp={fetchEmail} id="fetch_email" className="input" required/>
                        </div>
                         
                         <div id="main_content" style={{display:"none"}}>
                    <input style={{display:"none"}} id="fid" readOnly/>

                        <div className="field input-field">
                            <input type="password" placeholder="Create password" id="create_ps" className="password" required/>
                            <i className='bx bx-hide eye-icon'></i>
                        </div>

                        <div className="field input-field">
                            <input type="password" placeholder="Confirm password" id="confirm_ps" className="password" required/>
                            <i className='bx bx-hide eye-icon'></i>
                        </div>
                        
                        <div className="field button-field">
                            
                            <button type="submit">Change Password</button>
                            
                        </div>
                        </div>
                    </form>

                   
                </div>

                <div className="line"></div>

               

              
            </div>
            
            </section>
        </>
)
}