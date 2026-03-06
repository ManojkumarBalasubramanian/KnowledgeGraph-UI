import Link from "next/link"

export default function Sidebar(){

return(

<div className="w-64 h-screen bg-gray-900 text-white p-6">

<h2 className="text-xl font-bold">
KG Platform
</h2>

<ul className="mt-6 space-y-4">

<li>
<Link href="/dashboard">Dashboard</Link>
</li>

<li>
<Link href="/enterprise">Enterprise</Link>
</li>

<li>
<Link href="/domains">Domains</Link>
</li>

<li>
<Link href="/subdomains">SubDomains</Link>
</li>

<li>
<Link href="/onboard/sql">Onboard SQL</Link>
</li>

<li>
<Link href="/onboard/cosmos">Onboard Cosmos</Link>
</li>

<li>
<Link href="/onboard/kafka">Onboard Kafka</Link>
</li>

<li>
<Link href="/graph">Graph Explorer</Link>
</li>

</ul>

</div>

)

}