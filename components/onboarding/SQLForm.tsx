"use client"

import {useState} from "react"
import {onboardSQL} from "@/services/onboardService"

export default function SQLForm(){

const [conn,setConn] = useState("")

const submit = async ()=>{

await onboardSQL(conn)

alert("SQL Metadata Onboarded")

}

return(

<div className="space-y-4">

<h2 className="text-xl font-bold">
SQL Server Onboarding
</h2>

<textarea
className="border p-2 w-full"
placeholder="Connection String"
onChange={(e)=>setConn(e.target.value)}
/>

<button
className="bg-blue-600 text-white px-4 py-2"
onClick={submit}
>

Onboard SQL

</button>

</div>

)

}