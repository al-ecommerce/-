import { Link } from "react-router-dom";
import "../style.css";
import { useState } from "react";
import { useEffect } from "react";



function Sidebar(){
  
const [category,setCategory]=useState([]);

useEffect(()=>{
    fetch("https://json-server-3w0y.onrender.com/categories")
    .then(res => res.json())
    .then(data => setCategory(data))
    .catch(err => console.log(err))
}, [])


    return(
        <aside id="sidebar" class="sidebar">

    <ul class="sidebar-nav" id="sidebar-nav">

<Link to="/">
      <li class="nav-item">
        <a class="nav-link">
          <i class="bi bi-grid"></i>
          <span>Home</span>
        </a>
      </li>
     </Link>

     <li class="nav-item" onClick={()=>{document.getElementById("ctg").style.display="block"}}>
        <a class="nav-link">
          <i class="bi bi-grid"></i>
          <span>Shop</span>
        </a>
      </li>

      <div id="ctg" style={{display:"none"}}>
      <li class="nav-heading">Categories</li>
{category.map(group =>(
  <Link to={group.link}>
      <li class="nav-item">
        <a class="nav-link collapsed">
          <i class="bi bi-person"></i>
          <span>{group.category}</span>
        </a>
      </li>
      </Link>
))}
</div>

      <Link to="/sign_login">
      <li class="nav-item">
        <a class="nav-link collapsed">
          <i class="bi bi-dash-circle"></i>
          <span>Sell</span>
        </a>
      </li>
      </Link>
      
      <li class="nav-item">
        <a class="nav-link collapsed">
          <i class="bi bi-file-earmark"></i>
          <span>FAQ</span>
        </a>
      </li>

      <Link to="/contact">
      <li class="nav-item">
        <a class="nav-link collapsed">
          <i class="bi bi-dash-circle"></i>
          <span>Contact</span>
        </a>
      </li>
      </Link>
      
      <li class="nav-item">
        <a class="nav-link collapsed">
          <i class="bi bi-dash-circle"></i>
          <span>Blank</span>
        </a>
      </li>
      <Link to="/dev">
      <li class="nav-item" style={{marginTop:"30px"}}>
        <a class="nav-link collapsed">
          <i class="bi bi-dash-circle"></i>
          <span>Dev</span>
        </a>
      </li>
      </Link>
    </ul>

  </aside>
  
    )
}

export default Sidebar;