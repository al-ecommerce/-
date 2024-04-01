import "../style.css";

export default function Footer(){
    return(
        <footer id="footer">
        <div class="footer-top">
            <div class="container">
                <div class="row">
                    <div class="col-lg-3 col-md-6">
                        <div class="footer-info">
                            <h3 style={{fontWeight:"400"}}>AL<span className="s" style={{fontSize:"25px"}}>ECOM</span></h3>
                            <p>
                                Accra<br/>Ghana<br/><br/>
                                <strong>Phone:</strong> 0549271528<br/>
                                <strong>Email:</strong> info@example.com<br/>
                            </p>
                            <div class="social-links mt-3">
                                <a  class="twitter"><i class="fa fa-twitter"></i></a>
                                <a  class="facebook"><i class="fa fa-facebook"></i></a>
                                <a  class="instagram"><i class="fa fa-instagram"></i></a>
                                <a  class="google-plus"><i class="fa fa-skype"></i></a>
                                <a  class="linkedin"><i class="fa fa-linkedin"></i></a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-6 footer-links">
                        <h4>Useful Links</h4>
                        <ul>
                            <li><i class="fa fa-chevron-right"></i> <a >Home</a></li>
                            <li><i class="fa fa-chevron-right"></i> <a href="#contact">Contact us</a></li>
                            <li><i class="fa fa-chevron-right"></i> <a >Services</a></li>
                            <li><i class="fa fa-chevron-right"></i> <a >Terms of service</a></li>
                            <li><i class="fa fa-chevron-right"></i> <a >Privacy policy</a></li>
                        </ul>
                    </div>
                    <div class="col-lg-3 col-md-6 footer-links">
                        <h4>Our Sales</h4>
                        <ul>
                            <li><i class="fa fa-chevron-right"></i> <a >Women</a></li>
                            <li><i class="fa fa-chevron-right"></i> <a >Men</a></li>
                            <li><i class="fa fa-chevron-right"></i> <a >Kids</a></li>
                            <li><i class="fa fa-chevron-right"></i> <a >Appliances</a></li>
                            <li><i class="fa fa-chevron-right"></i> <a >Shoes</a></li>
                        </ul>
                    </div>
                    <div class="col-lg-4 col-md-6 footer-newsletter">
                        <h4>Our Newsletter</h4>
                        <p>Tamen quem nulla quae legam multos aute sint culpa legam noster magna</p>
                        <form action="" method="post">
                            <input type="email" name="email"/><input type="submit" value="Subscribe"/>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="copyright">
                &copy; Copyright <strong><span>AL</span></strong>. All Rights Reserved
            </div>
        </div>
    </footer>
    )
}