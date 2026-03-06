"use client"

import cytoscape from "cytoscape"
import {useEffect} from "react"

export default function GraphViewer({data}:any){

useEffect(()=>{

if(!data) return

cytoscape({

container:document.getElementById("graph"),

elements:data,

layout:{
name:"cose"
}

})

},[data])

return(

<div
id="graph"
style={{height:"700px"}}
/>

)

}