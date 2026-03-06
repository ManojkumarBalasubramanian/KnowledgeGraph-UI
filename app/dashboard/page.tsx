"use client"

import {useEffect,useState} from "react"
import {getHealth,getMetrics} from "@/services/systemService"

export default function Dashboard(){

const [health,setHealth] = useState(null)
const [metrics,setMetrics] = useState(null)

useEffect(()=>{

getHealth().then(setHealth)
getMetrics().then(setMetrics)

},[])

return(

<div>

<h1 className="text-2xl font-bold">
System Dashboard
</h1>

<div className="mt-4">

<h3 className="font-semibold">Health</h3>

<pre>{JSON.stringify(health,null,2)}</pre>

</div>

<div className="mt-4">

<h3 className="font-semibold">Metrics</h3>

<pre>{JSON.stringify(metrics,null,2)}</pre>

</div>

</div>

)

}