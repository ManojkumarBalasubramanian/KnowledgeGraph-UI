import {create} from "zustand"

export const useStore = create((set)=>({

enterprise:null,

setEnterprise:(val:any)=>set({enterprise:val})

}))