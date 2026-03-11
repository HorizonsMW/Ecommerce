// middleware/validateObjectId.js
const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
    if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ 
            message: `Invalid ID format: "${req.params.id}"` 
        });
    }
    next();
};

module.exports = validateObjectId;
/* //not in use for now

// In productRoutes.js
const validateObjectId = require('../middleware/validateObjectId');

router.get('/:id', validateObjectId, getProductById);
*/