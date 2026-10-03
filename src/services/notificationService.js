const { db, createId } = require('../dataStore');

function notify(type, userId, message) {
  db.notifications.push({
    id: createId('notif'),
    type,
    userId,
    message,
    createdAt: new Date().toISOString(),
  });
}

module.exports = { notify };
