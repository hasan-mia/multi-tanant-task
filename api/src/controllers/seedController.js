const { exec } = require('child_process');

exports.runSeeds = (req, res) => {
  exec('npx sequelize-cli db:seed:all', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: stderr });
    }
    res.json({ success: true, message: stdout });
  });
};

exports.undoSeeds = (req, res) => {
  exec('npx sequelize-cli db:seed:undo:all', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: stderr });
    }
    res.json({ success: true, message: stdout });
  });
};

exports.runMigrates = (req, res) => {
  exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: stderr });
    }
    res.json({ success: true, message: stdout });
  });
};

exports.undoMigrates = (req, res) => {
  exec('npx sequelize-cli db:migrate:undo:all', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: stderr });
    }
    res.json({ success: true, message: stdout });
  });
};
