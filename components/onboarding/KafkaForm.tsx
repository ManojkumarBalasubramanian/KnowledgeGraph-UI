"use client"

import {useState} from "react"
import {onboardKafka} from "@/services/onboardService"

export default function KafkaForm(){

const [bootstrap,setBootstrap] = useState("")

const submit = async ()=>{

await onboardKafka({

bootstrap_servers:bootstrap

})

alert("Kafka Onboarded")

}

return(

<div className="space-y-4">

<input
className="border p-2 w-full"
placeholder="Bootstrap Servers"
onChange={(e)=>setBootstrap(e.target.value)}
/>

<button
className="bg-blue-600 text-white px-4 py-2"
onClick={submit}
>

Onboard Kafka

</button>

</div>

)

}