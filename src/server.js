require('dotenv').config();
const { app } = require('./app');
const { startScheduler } = require('./services/scheduler');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  startScheduler();
  // eslint-disable-next-line no-console
  console.log(`Library management API listening on ${port}`);
});
