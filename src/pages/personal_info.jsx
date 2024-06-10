
import UserSet from "../components/userset";
import React from "react";
var readonly={
    padding:"2px 3px",
    width:"100%",
    border:"none"
}


var path=`${process.env.REACT_APP_API_URL}/account`;


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
               
                document.getElementById("profile").style.display="block";
                
                document.getElementById("email").value=data[i].email;
                document.getElementById("username").value=data[i].username;
                document.getElementById("idpro").innerHTML=data[i].id;
                document.getElementById("passco").value=data[i].passkey;
                
    document.getElementById("fullname").value=data[i].fullname;
    document.getElementById("about").value=data[i].about;
    document.getElementById("company").value=data[i].company;
    document.getElementById("job").value=data[i].job;
    document.getElementById("country").value=data[i].country;
    document.getElementById("address").value=data[i].address;
    document.getElementById("phone").value=data[i].phone;

    document.getElementById("topfullname").innerHTML=data[i].fullname;
    
    document.getElementById("topjob").innerHTML=data[i].job;

    document.getElementById("overviewfullname").innerHTML=data[i].fullname;
    document.getElementById("overviewabout").innerHTML=data[i].about;
    document.getElementById("overviewcompany").innerHTML=data[i].company;
    document.getElementById("overviewjob").innerHTML=data[i].job;
    document.getElementById("overviewcountry").innerHTML=data[i].country;
    document.getElementById("overviewaddress").innerHTML=data[i].address;
    document.getElementById("overviewphone").innerHTML=data[i].phone;
    document.getElementById("overviewemail").innerHTML=data[i].email;
    document.getElementById("overviewusername").innerHTML=data[i].username;

                
                
                
            }

            else{
                    
            setTimeout(()=>{
                document.getElementById("loginread").value=null;
            },3000)

                document.getElementById("loginread").value="invalid email or password"
                document.getElementById("loginread").style.color="red"
            
            }
           }
    }
export default function PersonalInfo(){
    
    // useEffect(() => emailjs.init("neoIsEgbi-PZwadW3"), []);
    // // Add these
    // const PatchPs = async (e) => {
    //     const emailRef = useRef<HTMLInputElement>();
  
   

    return(
        <div>
        <section onLoad={()=>{document.getElementById("emaill").value=localStorage.getItem("emaill");document.getElementById("check").checked=localStorage.getItem("checking");document.getElementById("logp").value=localStorage.getItem("passk")}} className="containerS" id="signuplogin">
            <div className="formpage login" id="login">
                
            <a onClick={()=>{window.history.back()}} style={{fontSize:"30px",cursor:"pointer"}}>&times;</a>
            
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
                        <input type="checkbox" id="check" /><label htmlFor="check">Remember me</label>
                           
                        </div>

                        <div className="field button-field">
                            
                            <button type="submit">Login</button>
                            
                        </div>
                    </form>

                   
                </div>

                <div className="line"></div>



            </div>
            
        </section>

<div style={{display:"none"}} id="profile">
    
<UserSet />
</div>
        </div>
    )
}