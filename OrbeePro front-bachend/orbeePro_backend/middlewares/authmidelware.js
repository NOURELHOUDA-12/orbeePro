const jwt =require('jsonwebtoken');

module.exports=(req,res,next)=>{
    try{
        const token=req.headers.authorization.split(' ')[1];
        if(!token){
            return res.status(401).json({message:"accés refusé .token manquant"})

        }


        const decodedToken=jwt.verify(token,process.env.JWT_SECRET)

        req.user={
            id:decodedToken.id,
            role:decodedToken.role
        };
        next();

    }
    catch(error){
        res.status(401).json({message:"session expirée ou token invalide"})
    }
};

