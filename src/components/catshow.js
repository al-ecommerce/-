import { useEffect, useState } from "react";
import "./cat.css"
import { Link } from "react-router-dom";


export default function Catshow(){
     
const [category,setCategory]=useState([]);
const [loading,setLoading]=useState(false);

useEffect(()=>{
    fetch("https://faint-dandelion-lilac.glitch.me/categories")
    .then(res => res.json())
    .then(data => {
        setCategory(data)
        setLoading(true)
    })
    .catch(err => console.log(err))
}, [])


    return(
        <>
 <div className="container-fluid pt-5">
        <h2 className="section-title  text-uppercase mx-xl-5 mb-4" style={{marginBottom:"0",padding:"0"}}><span className="pr-3">Categories</span></h2>
        
        <center>{loading ? <a></a> : <a>Loading<i className="fa fa-spinner fa-spin"></i></a>}</center>
        <div className="row px-xl-5 pb-3">
            {category.map((cat)=>(
                <div key={cat.id} className="col-lg-3 col-md-4 col-sm-6 pb-1">
                <Link to={cat.link}>
                    <div className="cat-item d-flex align-items-center mb-4">
                        <div className="overflow-hidden" style={{width: "100px", height: "100px"}}>
                            <img className="img-fluid" src={require("../img/worldwide.png")} alt="" />
                        </div>
                        <div className="flex-fill pl-3">
                            <h6>{cat.category}</h6>
                            <small className="text-body">Explore</small>
                        </div>
                    </div>
                </Link>
            </div>
            ))}
        
        </div>
    </div>
   
        </>
    )
}