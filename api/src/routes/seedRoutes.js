const express = require('express');
const {
  runSeeds,
  undoSeeds,
  runMigrates,
  undoMigrates,
} = require('../controllers/seedController');
const seedRouter = express.Router();

seedRouter.get('/run', runSeeds);
seedRouter.get('/undo', undoSeeds);
seedRouter.get('/migrate/run', runMigrates);
seedRouter.get('/migrate/undo', undoMigrates);

module.exports = seedRouter;
