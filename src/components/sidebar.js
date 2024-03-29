import { Link } from "react-router-dom";
import "../style.css";
import { useState } from "react";
import { useEffect } from "react";



function Sidebar(){
  
const [category,setCategory]=useState([]);

useEffect(()=>{
    fetch("http://localhost:3001/categories")
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


      <li class="nav-heading">POST</li>
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
      <li class="nav-item">
        <a class="nav-link collapsed">
          <i class="bi bi-dash-circle"></i>
          <span>Blank</span>
        </a>
      </li>

      
    </ul>

  </aside>
  
    )
}

export default Sidebar;