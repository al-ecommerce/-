import { useEffect, useState } from "react"
import Header from "./header";

export default function BlogPost(){
const [blog,setBlog]=useState([]);

useEffect(()=>{
    fetch("https://faint-dandelion-lilac.glitch.me/blog")
.then(res => res.json())
.then(data => setBlog(data))
.catch(err => console.log(err));
},[])
    return(
        <>
        <Header />
        <section className="blog spad">
        <div className="container">
            <div className="row">
      {blog.map((blg)=>(
        <div className="col-lg-4 col-md-6 col-sm-6">
                    <div className="blog__item">
                        <div className="blog__item__pic set-bg"></div>
                        <div className="blog__item__text">
                            <span><img src={blg.image} alt=""/>{blg.date}</span>
                            <h5>{blg.title}</h5>
                            <a>Read More</a>
                        </div>
                    </div>
                </div>
      ))}          
                
                
                
            </div>
        </div>
    </section>
    
        </>
    )
}