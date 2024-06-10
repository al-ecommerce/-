
import "../bootstrap.css";
import "../style.css";
import Footer from "./footer";
import ScrollToTop from "react-scroll-to-top";
import Sidebar from "./sidebar";
import Header from "./header";
const pl="tarry-hail-koala"

function Overview(){
    var overview=document.getElementById("profile-overview");
    var edit=document.getElementById("profile-edit")
    var settings=document.getElementById("profile-settings")
    
    overview.classList.remove("hide");
    edit.classList.add("hide");
    settings.classList.add("hide")
}


function Edit(){
  // var fullname=document.getElementById("fullname");
    var overview=document.getElementById("profile-overview");
    var edit=document.getElementById("profile-edit")
    var settings=document.getElementById("profile-settings")
    

    overview.classList.add("hide");
    edit.classList.remove("hide");
    settings.classList.add("hide")
}

function Settings(){
    var overview=document.getElementById("profile-overview");
    var edit=document.getElementById("profile-edit")
    var settings=document.getElementById("profile-settings")
    
    overview.classList.add("hide");
    edit.classList.add("hide");
    settings.classList.remove("hide")
}




document.addEventListener("load", (e)=>{
if(e.crtlKey && e.key === "s"){
  pushChanges();
}
})

// function SaveChanges(){
//   var editfullname=document.getElementById("fullname").value;
//   var editabout=document.getElementById("about").value;
//   var editcompany=document.getElementById("company").value;
//   var editjob=document.getElementById("job").value;
//   var editcountry=document.getElementById("country").value;
//   var editaddress=document.getElementById("address").value;
//   var editphone=document.getElementById("phone").value;
//   var editemail=document.getElementById("email").value;
//   var editusername=document.getElementById("username").value;
   
  
  
//   localStorage.setItem("fulln" , editfullname)
//   localStorage.setItem("about" , editabout)
//   localStorage.setItem("company" , editcompany)
//   localStorage.setItem("job" , editjob)
//   localStorage.setItem("country" , editcountry)
//   localStorage.setItem("address" , editaddress)
//   localStorage.setItem("phone" , editphone)
//   localStorage.setItem("email" , editemail)
//   localStorage.setItem("username" , editusername)


//   alert("Saved")

// }


function ChangeImage(){
  var inputimg=document.getElementById("image-input");
  var datafile=inputimg.files[0];
  var filereader= new FileReader();
  var topimg=document.getElementById("topimg")
   filereader.readAsDataURL(datafile);


  filereader.addEventListener("load", () => {
    var url=filereader.result;
    topimg.src= url;
    localStorage.setItem("topimg", url);

  })
}

function Profile(){
  setTimeout(()=>{

    var firstchance=localStorage.getItem("fst");
    if(firstchance != "1"){
      alert("Make sure you save changes after editing your profile!");

      localStorage.setItem("fst", "1");
    }

    
    // document.getElementById("topfullname").innerHTML=localStorage.getItem("fulln");
    
    // document.getElementById("topjob").innerHTML=localStorage.getItem("job")


    // document.getElementById("overviewfullname").innerHTML=document.getElementById("fullname").value
    // document.getElementById("overviewabout").innerHTML=document.getElementById("about").value
    
    // document.getElementById("overviewcompany").innerHTML=document.getElementById("company").value
    // document.getElementById("overviewjob").innerHTML=document.getElementById("job").value
    // document.getElementById("overviewcountry").innerHTML=document.getElementById("country").value
    // document.getElementById("overviewaddress").innerHTML=document.getElementById("address").value
    // document.getElementById("overviewphone").innerHTML=document.getElementById("phone").value
    // document.getElementById("overviewemail").innerHTML=document.getElementById("email").value
    // document.getElementById("overviewusername").innerHTML=document.getElementById("username").value



var localsurl=localStorage.getItem("topimg");
document.getElementById("topimg").src=localsurl;
  },1000)
 
}



function pushChanges(){
    var id= document.getElementById("idpro").innerHTML;
  
    var editfullname=document.getElementById("fullname").value;
    var editabout=document.getElementById("about").value;
    var editcompany=document.getElementById("company").value;
    var editjob=document.getElementById("job").value;
    var editcountry=document.getElementById("country").value;
    var editaddress=document.getElementById("address").value;
    var editphone=document.getElementById("phone").value;
    var editemail=document.getElementById("email").value;
    var editusername=document.getElementById("username").value;
    var editpasskey=document.getElementById("passco").value;
    var d=new Date();
    var time=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
   var accountP=process.env.REACT_APP_API_URL;


    fetch(accountP, {
        method:"PATCH",
        body:JSON.stringify({
            "id":id,
            "username":editusername,
            "email":editemail,
            "phone":editphone,
            "passkey":editpasskey,
            "notice":"",
            "date":time,
            "address":editaddress,
            "country":editcountry,
            "job":editjob,
            "company":editcompany,
            "about":editabout,
            "fullname":editfullname
        }),
        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
    
    alert("Success")

    window.location.reload();
})
    .catch(err => console.log(err))
   
}const el=".glitch";
export default function UserSet() {
    return (
        <div onLoad={Profile()}>

<br/>
<br/>
<Header />
	


  <main id="main" className="main">
	
<Sidebar />

<section className="section profile">
  <div className="row">
    <div className="col-xl-4">

      <div className="cardy">
        <div className="card-body profile-card pt-4 d-flex flex-column align-items-center">

          <img  alt="Profile Image" src={require('../img/avatar.jpg')} id="topimg" className="rounded-circle" />
          <h2 id="topfullname"></h2>
          <h3 id="topjob"></h3>
         
        </div>
      </div>

    </div>

    <div className="col-xl-8">

      <div className="card">
        <div className="card-body pt-3">
          
          <ul className="nav nav-tabs nav-tabs-bordered">

            <li className="nav-item">
              <button className="nav-link active" onClick={Overview}>Overview</button>
            </li>

            <li className="nav-item">
              <button className="nav-link" onClick={Edit}>Edit Profile</button>
            </li>

            <li className="nav-item">
              <button className="nav-link" onClick={Settings}>Settings</button>
            </li>

          </ul>


          <div className="tab-content pt-2">




            <div className="profile-overview" id="profile-overview">
              <h5 className="card-title">About</h5>
              <p className="small fst-italic" id="overviewabout"></p>

              <h5 className="card-title">Profile Details</h5>
              <div className="row">
                <div className="col-lg-3 col-md-4 label ">ID</div>
                <div className="col-lg-9 col-md-8" id="idpro"></div>
              </div>
              <div className="row">
                <div className="col-lg-3 col-md-4 label ">Full Name</div>
                <div className="col-lg-9 col-md-8" id="overviewfullname"></div>
              </div>

              <div className="row">
                <div className="col-lg-3 col-md-4 label">Company</div>
                <div className="col-lg-9 col-md-8" id="overviewcompany"></div>
              </div>

              <div className="row">
                <div className="col-lg-3 col-md-4 label">Job</div>
                <div className="col-lg-9 col-md-8" id="overviewjob"></div>
              </div>

              <div className="row">
                <div className="col-lg-3 col-md-4 label">Country</div>
                <div className="col-lg-9 col-md-8" id="overviewcountry"></div>
              </div>

              <div className="row">
                <div className="col-lg-3 col-md-4 label">Address</div>
                <div className="col-lg-9 col-md-8" id="overviewaddress"></div>
              </div>

              <div className="row">
                <div className="col-lg-3 col-md-4 label">Phone</div>
                <div className="col-lg-9 col-md-8" id="overviewphone"></div>
              </div>

              <div className="row">
                <div className="col-lg-3 col-md-4 label">Email</div>
                <div className="col-lg-9 col-md-8" id="overviewemail"></div>
              </div>
              <div className="row">
                <div className="col-lg-3 col-md-4 label">Username</div>
                <div className="col-lg-9 col-md-8" id="overviewusername"></div>
              </div>

            </div>





            <div className="hide profile-edit pt-3" id="profile-edit">

              
              <form action="#" onSubmit={pushChanges}>
                <div className="row mb-3">
                  <label for="profileImage" className="col-md-4 col-lg-3 col-form-label">Profile Image</label>
                  <div className="col-md-8 col-lg-9">
                    <input type="file" onChange={ChangeImage} id="image-input" accept="image"/>
                    <div className="pt-2">
                      <label for="image-input"><a className="btn btn-primary btn-sm" title="Upload new profile image"><i className="fa fa-upload"></i></a></label>
                      <a href="#" className="btn btn-danger btn-sm" title="Remove my profile image" onClick={()=>{localStorage.removeItem("topimg")}}><i className="fa fa-trash-o"></i></a>
                    </div>
                  </div>
                </div>
                <div className="row mb-3" style={{display:"none"}}>
                  <label for="passco" className="col-md-4 col-lg-3 col-form-label"></label>
                  <div className="col-md-8 col-lg-9">
                    <input name="fullName" type="text" className="form-control" id="passco"/>
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="fullName" className="col-md-4 col-lg-3 col-form-label">Full Name</label>
                  <div className="col-md-8 col-lg-9">
                    <input name="fullName" type="text" className="form-control" id="fullname" onKeyUp={()=>{document.getElementById("overviewfullname").innerHTML=document.getElementById("fullname").value}}/>
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="about" className="col-md-4 col-lg-3 col-form-label">About</label>
                  <div className="col-md-8 col-lg-9">
                    <textarea name="about" className="form-control" id="about" onKeyUp={()=>{document.getElementById("overviewabout").innerHTML=document.getElementById("about").value}} style={{height: "100px"}}>Sunt est soluta temporibus accusantium neque nam maiores cumque temporibus. Tempora libero non est unde veniam est qui dolor. Ut sunt iure rerum quae quisquam autem eveniet perspiciatis odit. Fuga sequi sed ea saepe at unde.</textarea>
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="company" className="col-md-4 col-lg-3 col-form-label">Company</label>
                  <div className="col-md-8 col-lg-9">
                    <input name="company" type="text" className="form-control" id="company" onKeyUp={()=>{document.getElementById("overviewcompany").innerHTML=document.getElementById("company").value}} />
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="Job" className="col-md-4 col-lg-3 col-form-label">Job</label>
                  <div className="col-md-8 col-lg-9">
                    <input name="job" type="text" className="form-control" id="job" onKeyUp={()=>{document.getElementById("overviewjob").innerHTML=document.getElementById("job").value}} />
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="Country" className="col-md-4 col-lg-3 col-form-label">Country</label>
                  <div className="col-md-8 col-lg-9">
                    <input name="country" type="text" className="form-control" id="country" onKeyUp={()=>{document.getElementById("overviewcountry").innerHTML=document.getElementById("country").value}} />
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="Address" className="col-md-4 col-lg-3 col-form-label">Address</label>
                  <div className="col-md-8 col-lg-9">
                    <input name="address" type="text" className="form-control" id="address" onKeyUp={()=>{document.getElementById("overviewaddress").innerHTML=document.getElementById("address").value}}/>
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="Phone" className="col-md-4 col-lg-3 col-form-label">Phone</label>
                  <div className="col-md-8 col-lg-9">
                    <input name="phone" type="number" className="form-control" id="phone" onKeyUp={()=>{document.getElementById("overviewphone").innerHTML=document.getElementById("phone").value}}/>
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="Email" className="col-md-4 col-lg-3 col-form-label">Email</label>
                  <div className="col-md-8 col-lg-9">
                    <input name="email" type="email" className="form-control" id="email" onKeyUp={()=>{document.getElementById("overviewemail").innerHTML=document.getElementById("email").value}}/>
                  </div>
                </div>

                <div className="row mb-3">
                  <label for="username" className="col-md-4 col-lg-3 col-form-label">Username</label>
                  <div className="col-md-8 col-lg-9">
                    <input name="username" type="text" className="form-control" id="username" onKeyUp={()=>{document.getElementById("overviewusername").innerHTML=document.getElementById("username").value}}/>
                  </div>
                </div>

              

              </form>

              <div className="text-center">
                  <button className="btn btn-primary" type="submit" onClick={pushChanges}>Save Changes</button>
                
                </div>
            </div>




            <div className="hide pt-3" id="profile-settings">

              
              <form>

                <div className="row mb-3">
                  <label for="fullName" className="col-md-4 col-lg-3 col-form-label">Email Notifications</label>
                  <div className="col-md-8 col-lg-9">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="changesMade" checked />
                      <label className="form-check-label" for="changesMade">
                        Changes made to your account
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="newProducts" checked />
                      <label className="form-check-label" for="newProducts">
                        Information on new products and services
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="proOffers" />
                      <label className="form-check-label" for="proOffers">
                        Marketing and promo offers
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="securityNotify" checked disabled />
                      <label className="form-check-label" for="securityNotify">
                        Security alerts
                      </label>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  
                </div>
              </form>

            </div>



          </div>

        </div>
      </div>

    </div>
  </div>
</section>

</main>


<Footer />

<ScrollToTop />
        </div>
    )
}