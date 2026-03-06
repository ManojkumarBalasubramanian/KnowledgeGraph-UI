"use client"

import {useEffect,useState} from "react"
import {getGraph} from "@/services/graphService"
import GraphViewer from "@/components/graph/GraphViewer"

export default function GraphPage(){

const [graph,setGraph] = useState(null)

useEffect(()=>{

getGraph().then(setGraph)

},[])

return(

<div>

<h1 className="text-2xl font-bold">
Knowledge Graph Explorer
</h1>

<GraphViewer data={graph}/>

</div>

)

}