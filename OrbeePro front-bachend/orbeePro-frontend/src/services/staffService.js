import { API_URL } from "../constants";
const token = localStorage.getItem("token");

export const StaffService = {


AddStaff: async (newStaff) => {
   
    
    const response = await fetch(`${API_URL}/staff/AddNewStaff`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStaff)
    });
    
    return await response.json();
},


  getAgents: async () => {
    const response = await fetch(`${API_URL}/staff/getAll`, {
     headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    return await response.json();
  },

  
  getUserById: async (id) => {
    const response = await fetch(`${API_URL}/staff/${id}`, {
      headers: {
        "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  },

  // Dans StaffService.js
updateAgent: async (id, staffData) => {
  const response = await fetch(`${API_URL}/staff/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(staffData)
  });
  return await response.json();
},



};
export default StaffService;
