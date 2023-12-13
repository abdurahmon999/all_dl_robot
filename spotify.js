require('dotenv').config()
const axios = require('axios');
const { parse } = require('spotify-uri');
const util = require('util');
const { getBuffer, filterAlphanumericWithDash } = require('./functions');
const fs = require('fs');

/*
** Endpoints **
https://api.spotifydown.com

* Download Song
/download/

* Metadata Playlist
/metadata/playlist/

* Track Playlist
/trackList/playlist/

*/

async function spotifyScraper(id, endpoint) {
  try {
    let { data } = await axios.get(`https://api.spotifydown.com/${endpoint}/${id}`, {
      headers: {
        'Origin': 'https://spotifydown.com',
        'Referer': 'https://spotifydown.com/',
      }
    })
    return data
  } catch (err) {
    return 'Error: ' + err
  }
}

async function getPlaylistSpotify(bot, chatId, url, userName) {
  let pars = await parse(url);
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.')
  try {
    let getdata = await spotifyScraper(`${pars.id}`, 'trackList/playlist')
    let data = [];
    getdata.trackList.map(maru => {
      data.push([{ text: `${maru.title} - ${maru.artists}`, callback_data: 'spt ' + maru.id }])
    })
    let options = {
      caption: 'Quyidagi tugmalardan birini bosib yuklab olmoqchi bolgan musiqangizni tanlang!',
      reply_markup: JSON.stringify({
        inline_keyboard: data
      })
    };
    await bot.sendPhoto(chatId, 'https://telegra.ph/file/a41e47f544ed99dd33783.jpg', options);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/spotify.js\n Function: getPlaylistSpotify()\n \n\n${err}`.trim());
    return bot.editMessageText('Pleylist maʼlumotlarini olishda xatolik yuz berdi!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function getAlbumsSpotify(bot, chatId, url, userName) {
  let pars = await parse(url);
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.')
  try {
    let getdata = await spotifyScraper(`${pars.id}`, 'trackList/album')
    let data = [];
    getdata.trackList.map(maru => {
      data.push([{ text: `${maru.title} - ${maru.artists}`, callback_data: 'spt ' + maru.id }])
    })
    let options = {
      caption: 'Quyidagi tugmalardan birini bosib yuklab olmoqchi bolgan musiqangizni tanlang!',
      reply_markup: JSON.stringify({
        inline_keyboard: data
      })
    };
    await bot.sendPhoto(chatId, 'https://telegra.ph/file/a41e47f544ed99dd33783.jpg', options);
    await bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/spotify.js\n Function: getAlbumsSpotify()\n \n\n${err}`.trim());
    return bot.editMessageText('Pleylist maʼlumotlarini olishda xatolik yuz berdi!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function getSpotifySong(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.')
  try {
    if (url.includes('spotify.com')) {
      let pars = await parse(url);
      let getdata = await spotifyScraper(pars.id, 'download');
      let fname = `${filterAlphanumericWithDash(getdata.metadata.title)}-${filterAlphanumericWithDash(getdata.metadata.artists)}_${chatId}.mp3`
      if (getdata.success) {
        await bot.editMessageText(`Qo'shiq yuklab olinmoqda ${getdata.metadata.title} - ${getdata.metadata.artists}, Iltimos kuting...`, { chat_id: chatId, message_id: load.message_id })
        let buff = await getBuffer(getdata.link);
        await fs.writeFileSync('content/' + fname, buff);
        await bot.sendAudio(chatId, 'content/' + fname, { caption: `Muvaffaqiyatli qo'shiq yuklab olish ${getdata.metadata.title} - ${getdata.metadata.artists}` });
        await bot.deleteMessage(chatId, load.message_id);
        await fs.unlinkSync('content/' + fname);
      } else {
        await bot.editMessageText('Xato, maʼlumotlarni olib boʻlmadi', { chat_id: chatId, message_id: load.message_id })
      }
    } else {
      let getdata = await spotifyScraper(url, 'download');
      let fname = `${filterAlphanumericWithDash(getdata.metadata.title)}-${filterAlphanumericWithDash(getdata.metadata.artists)}_${chatId}.mp3`
      if (getdata.success) {
        await bot.editMessageText(`Qo'shiq yuklab olinmoqda ${getdata.metadata.title} - ${getdata.metadata.artists}, Iltimos kuting...`, { chat_id: chatId, message_id: load.message_id })
        let buff = await getBuffer(getdata.link);
        await fs.writeFileSync('content/' + fname, buff);
        await bot.sendAudio(chatId, 'content/' + fname, { caption: `Muvaffaqiyatli qo'shiq yuklab olish ${getdata.metadata.title} - ${getdata.metadata.artists}` });
        await bot.deleteMessage(chatId, load.message_id);
        await fs.unlinkSync('content/' + fname);
      } else {
        await bot.editMessageText('Xato, maʼlumotlarni olib boʻlmadi', { chat_id: chatId, message_id: load.message_id })
      }
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/spotify.js\n Function: getSpotifySong()\n \n\n${err}`.trim());
    return bot.editMessageText('Qoshiqni yuklab bolmadi!', { chat_id: chatId, message_id: load.message_id })
  }
}

module.exports = {
  getPlaylistSpotify,
  getAlbumsSpotify,
  getSpotifySong
}