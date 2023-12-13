/* required to disable the deprecation warning, 
will be fixed when node-telegram-bot-api gets a new update */
require('dotenv').config()
process.env['NTBA_FIX_350'] = 1
let express = require('express');
const dbFunctions = require('./users');
let app = express();
let TelegramBot = require('node-telegram-bot-api')
let fs = require('fs')
const { InlineKeyboardButton, InlineKeyboardMarkup } = require('node-telegram-bot-api');

let {
  getTiktokInfo,
  tiktokVideo,
  tiktokAudio,
  tiktokSound
} = require('./funcs/tiktok')
let {
  getDataTwitter,
  downloadTwitterHigh, 
  downloadTwitterLow,
  downloadTwitterAudio
} = require('./funcs/twitter')
let {
  getPlaylistSpotify,
  getAlbumsSpotify,
  getSpotifySong
} = require('./funcs/spotify')
let {
  downloadInstagram
} = require('./funcs/instagram')
let {
  pinterest,
  pinSearch
} = require('./funcs/pinterest')

let {
  getFacebook,
  getFacebookNormal,
  getFacebookHD,
  getFacebookAudio
} = require('./funcs/facebook')
let {
  threadsDownload
} = require('./funcs/threads')
let {
  readDb,
  writeDb,
  addUserDb,
  changeBoolDb
} = require('./funcs/database');
const { count } = require('console');
let userLocks = {};
let userLocksText = {};
let userLocksImage = {}
let token = process.env.TOKEN
let bot = new TelegramBot(token, {
  polling: true
})
// Bot Settings
app.get('/', async (req, res) => {
  res.send({
    Status: "Active"
  })
})

app.listen(5000, function () { });
console.log('Bot is running...')

// let userCount = 0

// start
bot.onText(/\/start/, async (msg) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [['Profil']]
    }
};
  let response = `Salom ${msg.from.first_name}
Iltimos, yuklab olmoqchi bo'lgan video yoki postga havolani yuboring, bot faqat ro'yxatdagi ijtimoiy tarmoqlarni qo'llab-quvvatlaydi

Royhat:
Threads (video, photo)
X / Twitter (video, photo)
Tiktok (video, audio)
Instagram (photo, reels, video, stories)
Facebook (video, reels)
Pinterest (video, photo)
Spotify (music, playlist)

Bot by Abdurahmon`
  let chatId = msg.chat.id;
  await bot.sendMessage(String(process.env.DEV_ID), `Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\nTarmoq: Start bosdi`)
  await bot.sendMessage(chatId, response);
})

// users
bot.onText(/\/users/, async (msg) => {
  const user = msg.from.id;
  if (user == process.env.DEV_ID) {
    dbFunctions.getCurrentUserCount((err, count) => {
      if (err) {
        console.error("Error getting user count:", err);
      } else {
        console.log(count);
        bot.sendMessage(msg.chat.id, `Bot foydalanuvchilar soni ${count}`);
      }
    });
  }
});


bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Обработчик события при нажатии кнопки 'Profil'
  if (msg.text === 'Profil') {
      const userFirstName = msg.from.first_name;
      const Familiya = msg.from.last_name
      const Username = msg.from.username
      const Nimadur = msg.from.language_code
      bot.sendMessage(chatId, `Ism: ${userFirstName}\nFamiliya: ${Familiya}\nUsername: ${Username}\nTil kodi: ${Nimadur}`);
  }
})





const states = {};

bot.onText(/\/rek/, (msg) => {
  const user = msg.from.id;
  const ega = process.env.DEV_ID;

  // Проверяем, что запрос пришел от разработчика
  if (user == ega) {
    // Проверяем, нет ли уже активного состояния "waitingForMessage"
    if (!states[ega] || states[ega].state !== "waitingForMessage") {
      // Устанавливаем состояние "waitingForMessage" для пользователя
      states[ega] = { state: "waitingForMessage" };

      // Запрашиваем у пользователя сообщение
      bot.sendMessage(ega, "Yubormoqchi bolgan habaringizni yuboring")
        .then(() => {
          // Ожидаем ответа от пользователя
          // if (user == ega) {
          bot.on('text', (response) => {
            if (states[ega] && states[ega].state === "waitingForMessage") {
              // Отправляем сообщение пользователю и выполняем дополнительные действия
              const msgtext = response.from.id
              if(msgtext == ega){
                const messageText = response.text;
                bot.sendMessage(ega, `Siz ushbu habarni yubordingiz: ${messageText}`)
                .then(() => {
                  // После отправки сообщения пользователю, можно выполнить дополнительные действия,
                  // например, отправку этого сообщения другим пользователям.
                  dbFunctions.getAllUserIds((err, userIds) => {
                    if (err) {
                      console.error('Error getting user IDs:', err.message);
                    } else {
                      // Loop through the array of user IDs and send a message to each user
                      userIds.forEach(userId => {
                        bot.sendMessage(userId, messageText)
                        .catch(error => {
                          console.error('Error sending message:', error.message);
                        });
                      });
                    }
                  });
                })
                .catch(error => {
                  console.error('Error sending message back to user:', error.message);
                });
              }

              // Убираем состояние "waitingForMessage" для пользователя
              delete states[ega];
          }
          });
        })
        .catch(error => {
          console.error('Error sending request for message:', error.message);
        });
    } else {
      // Если есть активное состояние, сообщаем пользователю
      bot.sendMessage(ega, "Извините, команда /rek уже активна.");
    }
  }
});


// Обработка команды /reset
bot.onText(/\/reset/, async (msg) => {
  const user = msg.from.id;
  if (user == process.env.DEV_ID) {
    dbFunctions.resetUserCount((err) => {
      if (err) {
        console.error("Error resetting user count:", err);
      } else {
        // Сообщение об успешном сбросе счетчика
        bot.sendMessage(msg.chat.id, `Bot foydalanuvchilar soni 0`);
      }
    });
  }
});


// Pinterest Search
bot.onText(/^(\/(pin|pinterest))/, async (msg) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  let input = msg.text.split(' ').slice(1).join(' ');
  let userId = msg.from.id.toString();
  if (userLocksImage[userId]) {
    return;
  }
  userLocksImage[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), `Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Pinterest`)
    await pinSearch(bot, msg.chat.id, input, msg.chat.username);
  } finally {
    userLocksImage[userId] = false;
  }
})

// Tiktok Regex
bot.onText(/https?:\/\/(?:.*\.)?tiktok\.com/, async (msg) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), ` Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Tik tok`)
    await getTiktokInfo(bot, msg.chat.id, msg.text, msg.chat.username);
  } finally {
    userLocks[userId] = false;
  }
})

// Twitter Regex
bot.onText(/https?:\/\/(?:.*\.)?x\.com/, async (msg) => {
  try {
    dbFunctions.incrementUserCount(msg.from.id, (err) => {
      if (err) {
        console.error('Ошибка при увеличении счетчика пользователя:', err);
        return; // Вернуться, если произошла ошибка
      }
    })
    let userId = msg.from.id.toString();
    if (userLocks[userId]) {
      return;
    }
    userLocks[userId] = true;
    try {
      await bot.sendMessage(String(process.env.DEV_ID), ` Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: x (twitter)`)
      await getDataTwitter(bot, msg.chat.id, msg.text, msg.chat.username);
    } finally {
      userLocks[userId] = false;
    }
  } catch (error) {
    console.error('Error:', error);
  }
})

// Instagram Regex
bot.onText(/(https?:\/\/)?(www\.)?(instagram\.com)\/.+/, async (msg) => {
  let userId = msg.from.id.toString();
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), `Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Instagram`)
    await downloadInstagram(bot, msg.chat.id, msg.text, msg.chat.username);
  } finally {
    userLocks[userId] = false;
  }
})

// Pinterest Regex
bot.onText(/(https?:\/\/)?(www\.)?(pinterest\.ca|pinterest\.?com|pin\.?it)\/.+/, async (msg) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), ` Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Pinterest`)
    await pinterest(bot, msg.chat.id, msg.text, msg.chat.username);
  } finally {
    userLocks[userId] = false;
  }
})

// Spotify Track Regex
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/track\/.+/, async (msg, match) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), ` Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Spotify`)
    await getSpotifySong(bot, msg.chat.id, match[0], msg.chat.username)
  } finally {
    userLocks[userId] = false;
  }
})

// Spotify Albums Regex
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/album\/.+/, async (msg, match) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), ` Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Spotify album`)
    await getAlbumsSpotify(bot, msg.chat.id, match[0], msg.chat.username)
  } finally {
    userLocks[userId] = false;
  }
})

// Spotify Playlist Regex
bot.onText(/(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.?com)\/playlist\/.+/, async (msg, match) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), ` Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Spotify playlist`)
    await getPlaylistSpotify(bot, msg.chat.id, match[0], msg.chat.username)
  } finally {
    userLocks[userId] = false;
  }
})




// Facebook Regex
bot.onText(/^https?:\/\/(www\.)?(m\.)?facebook\.com\/.+/, async (msg, match) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), ` Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Facebook`)
    await getFacebook(bot, msg.chat.id, match[0], msg.chat.username)
  } finally {
    userLocks[userId] = false;
  }
})

// Threads Regex
bot.onText(/^https?:\/\/(www\.)?threads\.net\/.+/, async (msg, match) => {
  dbFunctions.incrementUserCount(msg.from.id, (err) => {
    if (err) {
      console.error('Ошибка при увеличении счетчика пользователя:', err);
      return; // Вернуться, если произошла ошибка
    }
  })
  let userId = msg.from.id.toString();
  if (userLocks[userId]) {
    return;
  }
  userLocks[userId] = true;
  try {
    await bot.sendMessage(String(process.env.DEV_ID), ` Ism: ${msg.from.first_name ? msg.from.first_name : "-"}\n Familiya:  ${msg.from.last_name ? msg.from.last_name : "-"}\n username: ${msg.from.username ? "@" + msg.from.username : "-"}\n ID : ${msg.from.id}\n Tarmoq: Threads`)
    await threadsDownload(bot, msg.chat.id, match[0], msg.chat.username)
  } finally {
    userLocks[userId] = false;
  }
})



bot.on('callback_query', async (mil) => {
  let data = mil.data;
  let url = data.split(' ').slice(1).join(' ');
  let chatid = mil.message.chat.id;
  let msgid = mil.message.message_id;
  let usrnm = mil.message.chat.username;
  if (data.startsWith('tta')) {
    await bot.deleteMessage(chatid, msgid);
    await tiktokAudio(bot, chatid, url, usrnm);
  } else if (data.startsWith('ttv')) {
    await bot.deleteMessage(chatid, msgid);
    await tiktokVideo(bot, chatid, url, usrnm);
  } else if (data.startsWith('tts')) {
    await bot.deleteMessage(chatid, msgid);
    await tiktokSound(bot, chatid, url, usrnm);
  } else if (data.startsWith('twh')) {
    await bot.deleteMessage(chatid, msgid);
    await downloadTwitterHigh(bot, chatid, usrnm);
  } else if (data.startsWith('twl')) {
    await bot.deleteMessage(chatid, msgid);
    await downloadTwitterLow(bot, chatid, usrnm);
  } else if (data.startsWith('twa')) {
    await bot.deleteMessage(chatid, msgid);
    await downloadTwitterAudio(bot, chatid, usrnm);
  } else if (data.startsWith('spt')) {
    await bot.deleteMessage(chatid, msgid);
    await getSpotifySong(bot, chatid, url, usrnm);
  } else if (data.startsWith('fbn')) {
    await bot.deleteMessage(chatid, msgid);
    await getFacebookNormal(bot, chatid, usrnm);
  } else if (data.startsWith('fbh')) {
    await bot.deleteMessage(chatid, msgid);
    await getFacebookHD(bot, chatid, usrnm);
  } else if (data.startsWith('fba')) {
    await bot.deleteMessage(chatid, msgid);
    await getFacebookAudio(bot, chatid, usrnm);
  } else if (data.startsWith('ytv')) {
    let args = url.split(' ');
    await bot.deleteMessage(chatid, msgid);
    await getYoutubeVideo(bot, chatid, args[0], args[1], usrnm);
  } else if (data.startsWith('yta')) {
    let args = url.split(' ');
    await bot.deleteMessage(chatid, msgid);
    await getYoutubeAudio(bot, chatid, args[0], args[1], usrnm);
  } else if (data.startsWith('tourl1')) {
    await bot.deleteMessage(chatid, msgid);
    await telegraphUpload(bot, chatid, url, usrnm);
  } else if (data.startsWith('tourl2')) {
    await bot.deleteMessage(chatid, msgid);
    await Pomf2Upload(bot, chatid, url, usrnm);
  } else if (data.startsWith('ocr')) {
    await bot.deleteMessage(chatid, msgid);
    await Ocr(bot, chatid, url, usrnm);
  }
})

process.on('uncaughtException', console.error)