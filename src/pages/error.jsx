import { Link } from "react-router-dom";

export default function Error(){
    return(
        <>
        <h2>404 page</h2>
        
            <a onClick={()=>{window.history.back()}}>BACK</a>
        </>
    )
}