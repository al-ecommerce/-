import Header from "../components/header";
import "../style.css";
import "../bootstrap.css";
import Sidebar from "../components/sidebar";
import Devfetch from "../components/dev_fetch";
import Update from "../components/update";

function fetchE(){
  fetch("https://json-server-3w0y.onrender.com/passcode")
  .then(res => res.json())
  .then(data => passkey(data))
}

function passkey(data){
  var key=document.getElementById("key").value;
  for(var i=0;i< data.length;i++){
    if(key === data[i].psk){
      document.getElementById("hide").style.display="block";
      document.getElementById("hero").style.display="none";
    
    }
  }
}

function Dev() {




  return (
    <section>
    <Header />
    <div id="main">
  <Sidebar />
  <Update />

  <br/>
  <br/>


  <section id="hero">
    <div className="hero-container">
      <div id="heroCarousel" className="carousel slide carousel-fade">

        <div className="carousel-inner">

          <div className="carousel-item active">
            <div className="carousel-container">
              <div className="carousel-content">
               <h2>Enter Key. NB: admins only</h2>
                 <input type="password" placeholder="key" id="key"/>
                <div>
                  <a  onClick={fetchE} className="btn-get-started animate__animated animate__fadeInUp scrollto">Enter</a>
                </div>
              </div>
            </div>
          </div>

  </div>
  </div>
  </div>
  </section>
  <br/>
<br/>
<br/>
<br/>

<div id="hide" className="hide">
<Devfetch />
</div>
</div>

    </section>
   
  )
}

export default Dev