import { useEffect, useState } from "react"
import "../style.css"
import { Link } from "react-router-dom"



function Overlay(){
    document.getElementById("overlay").style.width="60%"
}
function Cls(){
    document.getElementById("overlay").style.width="0"
}
export default function Header(){


    const color={
        color:"white",
        listStyle:"none",
        lineHeight:"3.0",
        textAlign:"justify",
        cursor:"pointer"
    }


const [category,setCategory]=useState([]);

useEffect(()=>{
    fetch("https://faint-dandelion-lilac.glitch.me/categories")
    .then(res => res.json())
    .then(data => setCategory(data))
    .catch(err => console.log(err))
}, [])

    return(
        <>
        <header className="top_header">
            <Link to="/">
                     <a style={{textDecoration:"none",color:"white"}}>AL<span className="s">ECOM</span></a>
                     </Link>

 <Link to="/sign_login">
       <a className="sell"><i className="fa fa-shopping-cart"></i>&emsp;Sign In</a>
       </Link>
       <a className="mobile-nav" onClick={Overlay}>&#9776;</a>
        </header>
         <div id="overlay">
                <ul style={{marginTop:"80px",fontWeight:"600"}}>
            <li onClick={Cls} style={{color:"white",listStyle:"none",cursor:"pointer",fontSize:"20px",position:"absolute",right:"30px"}}>&times;</li>
             <Link to="/">
             <li style={color}>Home</li>
             </Link>

             <li style={color} onClick={()=>{document.getElementById("mini_cat").style.display="block"}}>Shop</li>
             <div style={{display:"none"}} id="mini_cat">
             <li style={color}><small style={{color:"#899bbd"}}>Categories</small></li>
             {category.map(group =>(
                <Link to={group.link}>
             <li style={color}>{group.category}</li>
             </Link>
            ))}
      </div>
  
      <Link to="/">
             <li style={color}>FAQ</li>
             </Link>

             <Link to="/blog">
             <li style={color}>Blog</li>
             </Link>
      <Link to="/contact">
             <li style={color}>Contact</li>
             </Link>
             <Link to="/ins_guide">
             <li style={color}>Installation Guide</li>
             </Link>
           
            </ul>
                </div>
        </>
    )
}