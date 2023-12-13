require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs')
const fs = require('fs')
const util = require('util')
const { readDb, writeDb, addUserDb, changeBoolDb } = require('./database');
const { getBuffer } = require('./functions')

function twitter(link) {
  return new Promise((resolve, reject) => {
    let config = {
      'URL': link
    }
    axios.post('https://twdown.net/', qs.stringify(config), {
      headers: {
        "user-agent": "Mozilla/5.0 (Linux; U; Android 12; in; SM-A015F Build/SP1A.210812.016.A015FXXS5CWB2) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36"
     }
    })
      .then(({ data }) => {
        const $ = cheerio.load(data)
        resolve({
          desc: $('div:nth-child(1) > div:nth-child(2) > p').text().trim(),
          thumb: $('div:nth-child(1) > img').attr('src'),
          HD: $('tbody > tr:nth-child(1) > td:nth-child(4) > a').attr('href'),
          SD: $('tr:nth-child(2) > td:nth-child(4) > a').attr('href'),
          audio: $('body > div.jumbotron > div.container > center > div.row > div.col-md-8.col-md-offset-2 > div.col-md-8.col-md-offset-2 > table.table.table-bordered.table-hover.table-striped > tbody > tr:nth-child(3) > td:nth-child(4) > a').attr('href')
        })
      })
      .catch(reject)
  })
}

async function twitterdl2(url) {
  try {
    const result = { status: true, type: "", media: [] }
    const { data } = await axios(`https://savetwitter.net/api/ajaxSearch`, {
      method: "post",
      data: { q: url, lang: "en" },
      headers: {
        accept: "*/*",
        "user-agent": "PostmanRuntime/7.32.2",
        "content-type": "application/x-www-form-urlencoded"
      }
    })
    let $ = cheerio.load(data.data)
    if ($("div.tw-video").length === 0) {
      $("div.video-data > div > ul > li").each(function () {
        result.type = "image"
        result.media.push($(this).find("div > div:nth-child(2) > a").attr("href"))
      })
    } else {
      $("div.tw-video").each(function () {
        result.type = "video"
        result.media.push({
          quality: $(this).find(".tw-right > div > p:nth-child(1) > a").text().split("(")[1].split(")")[0],
          url: $(this).find(".tw-right > div > p:nth-child(1) > a").attr("href")
        })
      })
    }
    return result
  } catch (err) {
    const result = {
      status: false,
      message: "Media not found!" + String(err)
    }
    console.log(result)
    return result
  }
}

async function getDataTwitter(bot, chatId, url, userName) {
  try {
    let surl = url.replace('https://x.com/', '');
    let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.');
    try {
      let getd = await twitter(url);
      if (!getd.HD && !getd.SD) {
        try {
          let get2 = await twitterdl2(url);
          if (get2.type == 'video') {
            await bot.sendChatAction(chatId, 'upload_video');
            await bot.sendVideo(chatId, get2.media[0].url, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' })
            return bot.deleteMessage(chatId, load.message_id);
          } else if (get2.type == 'image') {
            for (let i = 0; i < get2.media.length; i++) {
              await bot.sendChatAction(chatId, 'upload_photo')
              await bot.sendPhoto(chatId, get2.media[i])
            }
            return bot.deleteMessage(chatId, load.message_id);
          }
        } catch (err) {
          await bot.deleteMessage(chatId, load.message_id);
          return bot.editMessageText('Video haqida maʼlumot olinmadi, Twitter havolasi togri va rasm emasligiga ishonch hosil qiling!', { chat_id: chatId, message_id: load.message_id })
        }
      } else if (getd.HD && getd.thumb) {
        let db = await readDb('./database.json');
        db[chatId] = {
          twhd: getd.HD,
          twsd: getd.SD,
          twaud: getd.audio
        };
        await writeDb(db, './database.json');
        let options = {
          caption: `${getd.desc ? getd.desc + '\n\n' : ''}Iltimos, quyidagi variantni tanlang!`,
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: 'Yuqori sifatli videolar', callback_data: 'twh' }],
              [{ text: 'Past sifatli videolar', callback_data: 'twl' }],
              [{ text: 'Faqat audio yuklab olish', callback_data: 'twa' }]
            ]
          })
        };
        await bot.sendChatAction(chatId, 'upload_photo')
        await bot.sendPhoto(chatId, getd.thumb, options);
        await bot.deleteMessage(chatId, load.message_id);
      }
    } catch (err) {
      await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/twitter.js\n Function: getDataTwitter()\n\n${err}`.trim());
      return bot.editMessageText('Xatolik yuz berdi!', { chat_id: chatId, message_id: load.message_id })
    }
  } catch (err) {
    console.error('Ошибка в getDataTwitter:', error);
  }
}


async function downloadTwitterHigh(bot, chatId, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.');
  let db = await readDb('./database.json');
  try {
    await bot.sendChatAction(chatId, 'upload_video')
    await bot.sendVideo(chatId, db[chatId].twhd, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' });
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      twhd: '',
      twsd: '',
      twaud: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/twitter.js\n Function: downloadTwitterHigh()\n\n${err}`.trim());
    await bot.editMessageText('Video yuklab olinmadi!\n\nIltimos, uni ozingiz brauzeringizda yuklab oling\n' + db[chatId].twhd, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      twhd: '',
      twsd: '',
      twaud: ''
    };
    await writeDb(db, './database.json');
  }
}

async function downloadTwitterLow(bot, chatId, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.');
  let db = await readDb('./database.json');
  try {
    await bot.sendChatAction(chatId, 'upload_video')
    await bot.sendVideo(chatId, db[chatId].twsd, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' });
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      twhd: '',
      twsd: '',
      twaud: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/twitter.js\n Function: downloadTwitterLow()\n\n${err}`.trim());
    await bot.editMessageText('Video yuklab olinmadi!\n\nIltimos, uni ozingiz brauzeringizda yuklab oling\n' + db[chatId].twsd, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      twhd: '',
      twsd: '',
      twaud: ''
    };
    await writeDb(db, './database.json');
  }
}

async function downloadTwitterAudio(bot, chatId, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.');
  let db = await readDb('./database.json');
  try {
    let buff = await getBuffer(db[chatId].twaud)
    await fs.writeFileSync('content/Twitt_audio_' + chatId + '.mp3', buff);
    await bot.sendChatAction(chatId, 'record_audio')
    await bot.sendAudio(chatId, 'content/Twitt_audio_' + chatId + '.mp3', { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' });
    await bot.deleteMessage(chatId, load.message_id);
    db[chatId] = {
      twhd: '',
      twsd: '',
      twaud: ''
    };
    await writeDb(db, './database.json');
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/twitter.js\n Function: downloadTwitterAudio()\n\n${err}`.trim());
    await bot.editMessageText('Audio yuborilmadi!\n\nIltimos, uni ozingiz brauzeringizda yuklab oling\n' + db[chatId].twaud, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true });
    db[chatId] = {
      twhd: '',
      twsd: '',
      twaud: ''
    };
    await writeDb(db, './database.json');
  }
}

module.exports = {
  getDataTwitter,
  downloadTwitterHigh,
  downloadTwitterLow,
  downloadTwitterAudio
}