import "../style.css";

export default function Footer(){
    return(
        <footer id="footer">
        <div className="footer-top">
            <div className="container">
                <div className="row">
                    <div className="col-lg-3 col-md-6">
                        <div className="footer-info">
                            <h3 style={{fontWeight:"400"}}>AL<span className="s" style={{fontSize:"25px"}}>ECOM</span></h3>
                            <p>
                                Accra<br/>Ghana<br/><br/>
                                <strong>Phone:</strong> 0549271528<br/>
                                <strong>Email:</strong> info@example.com<br/>
                            </p>
                            <div className="social-links mt-3">
                                <a  className="twitter"><i className="fa fa-twitter"></i></a>
                                <a  className="facebook"><i className="fa fa-facebook"></i></a>
                                <a  className="instagram"><i className="fa fa-instagram"></i></a>
                                <a  className="google-plus"><i className="fa fa-skype"></i></a>
                                <a  className="linkedin"><i className="fa fa-linkedin"></i></a>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-6 footer-links">
                        <h4>Useful Links</h4>
                        <ul>
                            <li><i className="fa fa-chevron-right"></i> <a >Home</a></li>
                            <li><i className="fa fa-chevron-right"></i> <a href="#contact">Contact us</a></li>
                            <li><i className="fa fa-chevron-right"></i> <a >Services</a></li>
                            <li><i className="fa fa-chevron-right"></i> <a >Terms of service</a></li>
                            <li><i className="fa fa-chevron-right"></i> <a >Privacy policy</a></li>
                        </ul>
                    </div>
                    <div className="col-lg-3 col-md-6 footer-links">
                        <h4>Our Sales</h4>
                        <ul>
                            <li><i className="fa fa-chevron-right"></i> <a >Women</a></li>
                            <li><i className="fa fa-chevron-right"></i> <a >Men</a></li>
                            <li><i className="fa fa-chevron-right"></i> <a >Kids</a></li>
                            <li><i className="fa fa-chevron-right"></i> <a >Appliances</a></li>
                            <li><i className="fa fa-chevron-right"></i> <a >Shoes</a></li>
                        </ul>
                    </div>
                    <div className="col-lg-4 col-md-6 footer-newsletter">
                        <h4>Our Newsletter</h4>
                        <p>Tamen quem nulla quae legam multos aute sint culpa legam noster magna</p>
                        <form action="https://formspree.io/f/xbjbobwv" method="post">
                            <input type="email" name="Email"/><input type="submit" value="Subscribe"/>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div className="container">
            <div className="copyright">
                &copy; Copyright <strong><span>AL</span></strong>. All Rights Reserved
            </div>
        </div>
    </footer>
    )
}