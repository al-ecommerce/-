import Footer from "../components/footer";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Update from "../components/update";

export default function Retailer(){
    return(
        <>
<Header />
        <div id="main">
            <Update />
            <Sidebar />
        <section id="retail" className="d-flex flex-column justify-content-center align-items-center">
    <div className="container text-center text-md-left">
      <h1>Sell Online to grow your business</h1>
      <h2>Earn more by selling.</h2>
      <a href="#/sign_login" className="btn-get-started scrollto">Start Selling</a>
    </div>
  </section>


  <section id="services" className="services">
      <div className="container-fluid">

        <div className="section-title">
          <h2>How it works</h2>
           </div>

        <div className="row justify-content-center">
          <div className="col-xl-10">
            <div className="row">
              <div className="col-lg-4 col-md-6 icon-box">
                <div className="icon"><i className="ri-pie-chart-line"></i></div>
                <h4 className="title"><a>Setup your business</a></h4>
                <p className="description">Youve have made an excellent choice of sign in as a Retailer. Don't miss the chance to sign in.</p>
              </div>
              <div className="col-lg-4 col-md-6 icon-box">
                <div className="icon"><i className="ri-markup-line"></i></div>
                <h4 className="title"><a>Add products</a></h4>
                <p className="description">Upload a full listing of your products and selling without delay. It's super easy and simple.</p>
              </div>
              <div className="col-lg-4 col-md-6 icon-box">
                <div className="icon"><i className="ri-body-scan-line"></i></div>
                <h4 className="title"><a>Start selling</a></h4>
                <p className="description">Once we have fully integrated your product listings with our platform, your store will go live!. Millions of consumers will be able to view the entire catalog of products and order. Keep up with your store via our check order button.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>



    </div>

    <Footer />
        </>
    )
}