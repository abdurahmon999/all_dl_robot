require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const util = require('util');

async function pindl(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Linux; U; Android 12; in; SM-A015F Build/SP1A.210812.016.A015FXXS5CWB2) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36"
      }
    });
    const $ = cheerio.load(data);
    const scriptTag = $('script[data-test-id="video-snippet"]').html() || $('script[data-test-id="leaf-snippet"]').html();
    if (scriptTag) {
      const jsonData = JSON.parse(scriptTag);
      const resultt = jsonData.contentUrl || jsonData.image;
      return resultt
    } else {
      result = "Xato: URL noto'g'ri!"
      return result;
    }
  } catch (err) {
    result = "Xato: URL noto'g'ri!"
    return result;
  }
}

async function pinSearch(bot, chatId, query, userName) {
  if (!query) return bot.sendMessage(chatId, '\nPinterestda qanday rasmlarni qidiryapsiz? misol\n /pin cars');
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting');
  try {
    let get = await axios.get(`https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=/search/pins/?q=${query}&data={"options":{"isPrefetch":false,"query":"${query}","scope":"pins","no_fetch_context_on_resource":false},"context":{}}`)
    let json = await get.data;
    let data = json.resource_response.data.results;
    if (!data.length) return bot.editMessageText(`Query "${query}" not found!`, { chat_id: chatId, message_id: load.message_id });
    await bot.sendPhoto(chatId, data[~~(Math.random() * (data.length))].images.orig.url, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' });
    return bot.deleteMessage(chatId, load.message_id);
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/pinterest.js\n Function: pinSearch()\n Query: ${query}\n\n${err}`.trim());
    return bot.editMessageText('Xatolik yuz berdi!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function pinterest(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda...')
  try {
    let get = await pindl(url);
    if (!get) {
      return bot.editMessageText('Maʼlumot olinmadi, Pinterest havolangiz togri ekanligiga ishonch hosil qiling!', { chat_id: chatId, message_id: load.message_id })
    } else {
      if (get.endsWith('.mp4')) {
        await bot.sendChatAction(chatId, 'upload_video')
        await bot.sendVideo(chatId, get, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' })
        return bot.deleteMessage(chatId, load.message_id);
      } else {
        await bot.sendPhoto(chatId, get, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' })
        return bot.deleteMessage(chatId, load.message_id);
      }
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/pinterest.js\n Function: pinterest()\n \n\n${err}`.trim());
    return bot.editMessageText('Media yuklab olinmadi, havolangiz togri ekanligiga ishonch hosil qiling!', { chat_id: chatId, message_id: load.message_id })
  }
}

module.exports = {
  pinterest,
  pinSearch
}