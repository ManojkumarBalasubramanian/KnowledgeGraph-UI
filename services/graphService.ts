import api from "./api"

export const getGraph = async ()=>{

const res = await api.get("/api/graph")

return res.data

}