const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Token not Found.' })
        }

        const data = authHeader.split(' ')[1];
        const token = jwt.verify(data, process.env.JWT_SECRET)
        if (!token) {
            return res.status(401).json({ message: 'Invalid Token or token has expired.' })
        }
        req.uid = token.uid;
        next();
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Access Denied or token has expired.' })
    }

}

module.exports = verifyToken;
