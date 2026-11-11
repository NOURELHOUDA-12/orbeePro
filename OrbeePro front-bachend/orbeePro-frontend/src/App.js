import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/Auth";


import Login from "./Components/Login/LoginPage";
import Register from "./Components/Login/Register/Register";
import ProtectedRoute from "./Components/Securite/ProtectedRoute";
import AdminLayout from "./Components/ReusedComposant/Layout";

import StaffPage from "./Components/Pages/Admin/Staff/StaffPage";

import Espaces from "./Components/Pages/Admin/Espaces/gestion des espaces/Espaces";

import ReclamationEmployee from "./Components/Pages/Employee/Reclamation Employee/Reclamation";

import TachesAdmin from "./Components/Pages/Admin/Taches/Taches";
import TacheEmployeemysql from './Components/Pages/Employee/TachesEmployee/Taches/TachesMySQL/EmployeeTaskManager'

import Devis from "./Components/Pages/Admin/DevisSQL/Devismanager";
import DashboardAdmin from "./Components/Pages/Admin/AdminDashboard/AdminDashboard";
import AdminReclamations from './Components/Pages/Admin/Réclamation V2/AdminReclamtions'
import Chat from './Components/Pages/Chat/Chat';
import Email from './Components/Pages/Admin/Email/Email'

import Profile from './Components/ReusedComposant/Profile/Profile'

function App() {

  
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />


            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />

            <Route element={<ProtectedRoute allowedRoles={['admin', 'maintenance', 'menage', 'chef-maintenance']} />}>
              <Route element={<AdminLayout />}>
                <Route path="personnel" element={<StaffPage />} />

                <Route path="DashboardAdmin" element={<DashboardAdmin />} />



                <Route path="espaces" element={<Espaces />} />

                

              
               
                <Route path="AdminReclamations" element={<AdminReclamations />} />    

                <Route path="TachesAdmin" element={<TachesAdmin />} />    
                

                <Route path="Devis" element={<Devis />} />    

                <Route path="Chat" element={<Chat />} />    


                <Route path="Email" element={<Email />} />    

                <Route path="Profile" element={<Profile />} />    

               {/*  it's for employee tasks */}

                <Route path="ReclamationEmployee" element={<ReclamationEmployee />} />
                <Route path="/TacheEmployeemysql" element={<TacheEmployeemysql />} />


                
              </Route>
            </Route>






 </Routes>
        </div>
      </Router>
    </AuthProvider>




 


  );





}

export default App;

