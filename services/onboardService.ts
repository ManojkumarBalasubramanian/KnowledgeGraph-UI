import api from "./api"

export const onboardSQL = async (connection_string:string) => {

return await api.post("/api/onboard/sql",{

connection_string

})

}

export const onboardCosmos = async (payload:any) => {

return await api.post("/api/onboard/cosmos",payload)

}

export const onboardKafka = async (payload:any) => {

return await api.post("/api/onboard/kafka",payload)

}