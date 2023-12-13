require('dotenv').config();
const axios = require('axios');

async function threadsDownload(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.');
  try {
    let get = await axios.get('https://api.threadsphotodownloader.com/v2/media?url=' + url);
    let data = get.data;
    if (data.image_urls[0] && !data.video_urls[0]) {
      let results = [];
      if (data.image_urls.length == 1) {
        await bot.sendPhoto(chatId, data.image_urls[0], { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' });
        return bot.deleteMessage(chatId, load.message_id);
      } else {
        data.image_urls.map(maru => {
          results.push({ type: 'photo', media: maru })
        })
        let currentIndex = 0;
        while (currentIndex < results.length) {
          let mediaToSend = results.slice(currentIndex, currentIndex + 10);
          currentIndex += 10;

          if (mediaToSend.length > 0) {
            await bot.sendMediaGroup(chatId, mediaToSend, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' });
          }
        }

        results.length = 0;
        await bot.deleteMessage(chatId, load.message_id);
      }
    } else if (data.video_urls[0] && !data.image_urls[0]) {
      await bot.sendChatAction(chatId, 'upload_video')
      await bot.sendVideo(chatId, data.video_urls[0].download_url, { caption: 'Bu bot Threads, Twitter, Tiktok, Instagram, Facebook, Pinterest, Spotify dan video, audio, photo, musiqa yuklay oladi📥\nBot @all_dl_robot' });
      return bot.deleteMessage(chatId, load.message_id);
    } else if (!data.image_urls[0] && !data.video_urls[0]) {
      return bot.editMessageText('Maʼlumotlar olinmadi, havolangiz yaroqliligiga ishonch hosil qiling!', { chat_id: chatId, message_id: load.message_id });
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/threads.js\n Function: threadsDownload()\n \n\n${err}`.trim());
    return bot.editMessageText('Media yuklab olinmadi, havolangiz yaroqliligiga ishonch hosil qiling!', { chat_id: chatId, message_id: load.message_id })
  }
}

module.exports = {
  threadsDownload
}