import "../styles/globals.css"
import Sidebar from "@/components/layout/Sidebar"
import Navbar from "@/components/layout/Navbar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

return (

<html lang="en">

<body>

<div className="flex">

<Sidebar/>

<div className="flex-1">

<Navbar/>

<div className="p-6">

{children}

</div>

</div>

</div>

</body>

</html>

)

}