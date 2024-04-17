import { Link } from "react-router-dom";
import "../style.css";
import { useState } from "react";
import { useEffect } from "react";



function Sidebar(){
  
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
        <aside id="sidebar" className="sidebar">

    <ul className="sidebar-nav" id="sidebar-nav">

<Link to="/">
      <li className="nav-item">
        <a className="nav-link">
          <i className="bi bi-grid"></i>
          <span>Home</span>
        </a>
      </li>
     </Link>

     <li className="nav-item" onClick={()=>{document.getElementById("ctg").style.display="block"}}>
        <a className="nav-link">
          <i className="bi bi-grid"></i>
          <span>Shop</span>
          
        </a>
      </li>

      <div id="ctg" style={{display:"none"}}>
      <li className="nav-heading">Categories</li>
      <li style={{color:"white"}}>{loading ? <a></a> : <a>Loading<i className="fa fa-spinner fa-spin"></i></a>}</li>
{category.map(group =>(
  <Link to={group.link}>
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-person"></i>
          <span>{group.category}</span>
        </a>
      </li>
      </Link>
))}
</div>


<li className="nav-heading">Useful Links</li>

      <Link to="/retail">
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-dash-circle"></i>
          <span>Become a Retailer</span>
        </a>
      </li>
      </Link>
      
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-file-earmark"></i>
          <span>FAQ</span>
        </a>
      </li>

      <Link to="/blog">
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-dash-circle"></i>
          <span>Blog</span>
        </a>
      </li>
      </Link>
      

      <Link to="/contact">
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-dash-circle"></i>
          <span>Contact</span>
        </a>
      </li>
      </Link>

      
      <Link to="/ins_guide">
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-dash-circle"></i>
          <span>Installation Guide</span>
        </a>
      </li>
      </Link>

      <Link to="/">
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-dash-circle"></i>
          <span>My Store</span>
        </a>
      </li>
      </Link>

      <Link to="/">
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-dash-circle"></i>
          <span>Admin Dashboard</span>
        </a>
      </li>
      </Link>

      <Link to="/">
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-dash-circle"></i>
          <span>AlEcom Partners</span>
        </a>
      </li>
      </Link>
      
      <li className="nav-item">
        <a className="nav-link collapsed">
          <i className="bi bi-dash-circle"></i>
          <span>Blank</span>
        </a>
      </li>
     
    </ul>

  </aside>
  
    )
}

export default Sidebar;