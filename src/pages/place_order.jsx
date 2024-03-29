


function PushChk(){
    var path="http://localhost:3001/orders";

    var chk_eml=document.getElementById("chk_eml").value;
    var chk_q=document.getElementById("chk_q").value;
    var chk_nom=document.getElementById("chk_nom").value;
    var chk_adr=document.getElementById("chk_adr").value;
    var chk_nm=document.getElementById("chk_nm").value;
    var chk_ctr=document.getElementById("chk_ctr").value;
    var chk_ord=document.getElementById("chk_ord").value;
    var chk_email=document.getElementById("chk_email").value;
    var chk_prod=document.getElementById("chk_prod").value;
    // const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const d=new Date();
// let monthy = month[d.getMonth()];
// let year= d.getFullYear();
let time=d.toLocaleTimeString([],{ hour:'2-digit', minute:'2-digit'});
    let date=d.toLocaleDateString();
    // var date=d.getDate();

    fetch(path,{
        method:"POST",
        body:JSON.stringify({
            "email_to": chk_eml,
            "quantity": chk_q,
            "email":chk_email,
            "phone":chk_nom,
            "product":chk_prod,
            "address":chk_adr,
            "name":chk_nm,
            "country":chk_ctr,
            "order_notes":chk_ord,
            "date":date+" "+time
        }),

        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
       alert("Order is placed. You would be contacted soon")
    })
    .catch(err => console.log(err))
}



export default function PlaceO(){
    return(
        <>
        <section className="checkout spad">
        <div className="container">
            <div className="checkout__form">
                <form onSubmit={PushChk}>
                    <div className="row">
                        <div className="col-lg-8 col-md-6">
                            <h6 className="checkout__title">Checkout Details</h6>
                            <div className="row">
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product Name<span>*</span></p>
                                        <input type="text" id="chk_prod" readOnly/>
                                    </div>
                                </div>
                                <div className="col-lg-6" style={{display:"none"}}>
                                    <div className="checkout__input">
                                        <p>Email To<span>*</span></p>
                                        <input type="text" id="chk_eml" readOnly/>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Your Name<span>*</span></p>
                                        <input type="text" id="chk_nm" required/>
                                    </div>
                                </div>
                            </div>
                            <div className="checkout__input">
                                <p>Country<span>*</span></p>
                                <input type="text" id="chk_ctr" required/>
                            </div>
                            <div className="checkout__input">
                                <p>Address<span>*</span></p>
                                <input type="text" placeholder="Street Address" className="checkout__input__add" id="chk_adr"/>
                            </div>
                            <div className="checkout__input">
                                <p>Quantity<span>*</span></p>
                                <input type="number"  className="checkout__input__add" id="chk_q" required/>
                            </div>
                            <div className="row">
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Phone<span>*</span></p>
                                        <input type="number" id="chk_nom" required/>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Email<span>*</span></p>
                                        <input type="email" id="chk_email" required/>
                                    </div>
                                </div>
                            </div>
                             
                            <div className="checkout__input">
                                <p>Order notes<span>*</span></p>
                                <input type="text"
                                placeholder="Notes about your order, e.g. special notes for delivery." id="chk_ord"/>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="checkout__order">
                                <h4 className="order__title">Your order</h4>
                                <div className="checkout__order__products">Product <span>Price</span></div>
                                <ul className="checkout__total__products">
                                    <li id="chk_pd"></li>
                                    <li style={{float:"right"}} id="chk_prc"></li>
                                </ul>
                                <button type="submit" className="site-btn">PLACE ORDER</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </section>
        </>
    )
}