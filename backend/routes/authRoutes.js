const express = require('express');

const router = express.Router();

router.get('/test', function(req, res) {
  res.json({
    success: true,
    message: 'Auth route funzionante'
  });
});

module.exports = router;
