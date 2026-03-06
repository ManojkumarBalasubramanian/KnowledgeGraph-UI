"use client"

import {useState} from "react"
import {onboardCosmos} from "@/services/onboardService"

export default function CosmosForm(){

const [uri,setUri] = useState("")
const [key,setKey] = useState("")
const [database,setDatabase] = useState("")

const submit = async ()=>{

await onboardCosmos({

uri,
key,
database

})

alert("Cosmos Onboarded")

}

return(

<div className="space-y-3">

<input
className="border p-2 w-full"
placeholder="Cosmos URI"
onChange={(e)=>setUri(e.target.value)}
/>

<input
className="border p-2 w-full"
placeholder="Key"
onChange={(e)=>setKey(e.target.value)}
/>

<input
className="border p-2 w-full"
placeholder="Database"
onChange={(e)=>setDatabase(e.target.value)}
/>

<button
className="bg-blue-600 text-white px-4 py-2"
onClick={submit}
>

Onboard Cosmos

</button>

</div>

)

}