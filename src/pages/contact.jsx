import "../style.css"
import Header from "../components/header";
import "../bootstrap.css";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Update from "../components/update";

export default function Contact(){
    return(
        <>
        <Header />
        <div id="main">
        <Sidebar/>
        <Update />
         <div className="map">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115650.5715450949!2d-0.249770358009287!3d5.591375400867234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9084b2b7a773%3A0xbed14ed8650e2dd3!2sAccra!5e1!3m2!1sen!2sgh!4v1655749477102!5m2!1sen!2sgh" height="500" style={{border:"0"}} allowFullScreen="" aria-hidden="false" tabIndex="0"></iframe>
    </div>
   
    <section className="contact spad">
        <div className="container">
            <div className="row">
                <div className="col-lg-6 col-md-6">
                    <div className="contact__text">
                        <div className="section-title">
                            <span>Information</span>
                            <h2>Contact Us</h2>
                            <p>As you might expect of a company that began as a high-end interiors contractor, we pay
                                strict attention.</p>
                        </div>
                        <ul>
                            <li>
                                <h4>Ghana</h4>
                                <p>Accra<br /><a href="tel:0549271528">+233 549271528</a></p>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="col-lg-6 col-md-6">
                    <div className="contact__form">
                        <form action="https://formspree.io/f/xbjbobwv" method="POST">
                            <div className="row">
                                <div className="col-lg-6">
                                    <input type="text" name="Name" placeholder="Name" required/>
                                </div>
                                <div className="col-lg-6">
                                    <input type="text" name="Email" placeholder="Email" required/>
                                </div>
                                <div className="col-lg-12">
                                    <textarea placeholder="Message" name="Message" required></textarea>
                                    <button type="submit" className="site-btn">Send Message</button>
                                </div>
                            </div>
                        </form>
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