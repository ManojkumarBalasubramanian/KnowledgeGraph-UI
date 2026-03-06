import api from "./api"

export const getHealth = async () => {

const res = await api.get("/health")

return res.data

}

export const getMetrics = async () => {

const res = await api.get("/metrics")

return res.data

}