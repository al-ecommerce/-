import { useEffect, useState } from "react"



export default function Update(){
    const [update,setUpdate]=useState([]);

    useEffect(()=>{
        fetch("https://faint-dandelion-lilac.glitch.me/update")
        .then(res=> res.json())
        .then(data=> setUpdate(data))
        .catch(err => console.log(err))
    })
    
    return(
        <>
        {update.map(upd =>(
        <div className="update" style={{display:`${upd.display}`}}>
            <p style={{color:`${upd.color}`}}>{upd.text}</p>
            </div>
            ))}
            
            
        </>
    )
}