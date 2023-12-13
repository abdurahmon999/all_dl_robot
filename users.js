const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./user_database.db');



// Создание таблицы user_incremented
db.run('CREATE TABLE IF NOT EXISTS user_incremented (user_id TEXT PRIMARY KEY)');


function incrementUserCount(userId, callback) {
  // Проверяем, был ли счетчик уже увеличен для данного пользователя
  db.get('SELECT * FROM user_incremented WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      console.error(err.message);
      callback(err);
    } else if (!row) {
      // Если счетчик еще не увеличен для данного пользователя, увеличиваем его
      db.run('UPDATE userCount SET count = count + 1', function(err) {
        if (err) {
          console.error(err.message);
          callback(err);
        } else {
          // Добавляем пользователя в список уже обработанных
          db.run('INSERT INTO user_incremented (user_id) VALUES (?)', [userId], function(err) {
            if (err) {
              console.error(err.message);
              callback(err);
            } else {
              callback(null);
            }
          });
        }
      }); 
    } else {
      // Счетчик уже увеличен для данного пользователя, не делаем ничего
      callback(null);
    }
  });
}


// Сброс счетчика пользователей и удаление записей об увеличенных пользователях
function resetUserCount(callback) {
  // Устанавливаем счетчик в 0
  db.run('UPDATE userCount SET count = 0', function(err) {
    if (err) {
      console.error(err.message);
      callback(err);
    } else {
      // После успешного сброса счетчика, удаляем записи об увеличенных пользователях
      db.run('DELETE FROM user_incremented', function(err) {
        if (err) {
          console.error(err.message);
          callback(err);
        } else {
          callback(null);
        }
      });
    }
  });
}

// Функция для получения текущего количества пользователей
function getCurrentUserCount(callback) {
  db.get('SELECT count FROM userCount ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error(err.message);
      // Важно передать ошибку в колбэк, чтобы обработать ее в вызывающем коде
      callback(err, null);
    } else {
      // Возвращаем значение счетчика пользователей через колбэк
      callback(null, row ? row.count : 0);
    }
  });
}



// Функция для получения всех идентификаторов пользователей
function getAllUserIds(callback) {
  db.all('SELECT user_id FROM user_incremented', (err, rows) => {
    if (err) {
      console.error(err.message);
      callback(err, null);
    } else {
      // Возвращаем массив идентификаторов пользователей через колбэк
      const userIds = rows.map(row => row.user_id);
      callback(null, userIds);
    }
  });
}



// Закрытие базы данных
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Database closed');
    }
  });
}

module.exports = {
  incrementUserCount,
  resetUserCount,
  getAllUserIds,
  getCurrentUserCount,
  closeDatabase,
};
