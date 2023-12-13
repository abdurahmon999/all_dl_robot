require('dotenv').config()
const axios = require('axios');
const cheerio = require('cheerio');
const util = require('util');
const fs = require('fs');
const { getBuffer, getRandom } = require('./functions')

async function igdl(url) {
  try {
    let { data } = await axios.get(`https://krxuv-api.vercel.app/api/instagram?apikey=Krxuvonly&url=${url}`);
    return data.results
  } catch (err) {
    return err
  }
}
async function downloadInstagram(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.')
  try {
    let get = await igdl(url);
    if (!get[0]) {
      return bot.editMessageText('Maʼlumot olinmadi, Instagram havolangiz togri ekanligiga ishonch hosil qiling!', { chat_id: chatId, message_id: load.message_id })
    } else if (get[0]) {
      let res = [];
      let res2 = [];
      if (get.length == 1) {
        if (get[0].type == 'Photo') {
          await bot.deleteMessage(chatId, load.message_id)
          await bot.sendChatAction(chatId, 'upload_photo')
          return bot.sendPhoto(chatId, get[0].thumbnail, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' })
        } else {
          try {
            await bot.sendChatAction(chatId, 'upload_video')
            await bot.sendVideo(chatId, get[0].url, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' })
          } catch (err) {
            let buff = await getBuffer(get[0].url);
             fs.writeFileSync('content/@all_dl_robot-' + chatId + '.mp4', buff)
            await bot.deleteMessage(chatId, load.message_id)
            await bot.sendChatAction(chatId, 'upload_video')
            await bot.sendVideo(chatId, 'content/@all_dl_robot-' + chatId + '.mp4', { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' })
             fs.unlinkSync('content/@all_dl_robot-' + chatId + '.mp4')
          }
        }
      } else {
        get.forEach(maru => {
          if (maru.type === 'Photo') {
            res.push({ type: 'photo', media: maru.thumbnail })
          } else {
            res2.push({ type: 'video', media: maru.url })
          }
        })
        let currentIndex = 0;
        while (currentIndex < res.length) {
          let mediaToSend = res.slice(currentIndex, currentIndex + 10);
          currentIndex += 10;

          if (mediaToSend.length > 0) {
            await bot.sendMediaGroup(chatId, mediaToSend, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' });
          }
        }
        res.length = 0;
        res2.map(async (mi) => {
          let nfile = await getRandom('.mp4')
          let buff = await getBuffer(mi.media);
           fs.writeFileSync('content/' + nfile, buff)
           await bot.sendChatAction(chatId, 'upload_video')
          await bot.sendVideo(chatId, 'content/' + nfile, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' })
           fs.unlinkSync('content/' + nfile)
        })
        await bot.deleteMessage(chatId, load.message_id)
      }
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/instagram.js\n Function: downloadInstagram()\n \n\n${err}`.trim());
    return bot.editMessageText('Xatolik yuz berdi, Instagram havolasi yaroqliligiga ishonch hosil qiling!', { chat_id: chatId, message_id: load.message_id })
  }
}
module.exports = {
  downloadInstagram
}