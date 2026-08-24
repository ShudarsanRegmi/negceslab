const express = require('express');
const router = express.Router();
const getLogger = require('../utils/logger');
const logger = getLogger('frontend');

// Endpoint to ingest client-side frontend logs
router.post('/ingest', (req, res) => {
  const { level, message, url, user, stack } = req.body;

  const logContext = {
    clientUrl: url || 'unknown',
    clientUser: user || 'anonymous',
    clientStack: stack || undefined
  };

  // Map severity levels to winston logger
  if (level === 'error') {
    logger.error(message, logContext);
  } else if (level === 'warn') {
    logger.warn(message, logContext);
  } else {
    logger.info(message, logContext);
  }

  // Return 204 No Content for rapid, non-blocking delivery
  res.sendStatus(204);
});

module.exports = router;
