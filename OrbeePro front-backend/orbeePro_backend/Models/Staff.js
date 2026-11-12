const db=require('../config/db')
const  Staff ={
    
create :async(data)=>{
        const {email,password,nom,prenom,tel,profileImage}=data;
const sql = "INSERT INTO staff (email, password, nom, prenom, tel, profileImage, role) VALUES (?, ?, ?, ?, ?, ?, 'user')";
return db.query(sql,[email,password,nom,prenom,tel,profileImage]);  

},


findByEmail :async(email)=>{
    const [rows]=await db.query("select * from staff where email=?",[email]);
    return rows[0];
}
};
module.exports=Staff

