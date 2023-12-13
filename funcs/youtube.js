require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const util = require('util');
const { htmlToText, getBuffer, filterAlphanumericWithDash } = require('./functions');
const { Y2MateClient } = require('y2mate-api');
const client = new Y2MateClient();

async function getYoutube(bot, chatId, url, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.');
  let data = [];
  try {
    if (url.includes('music.youtube.com')) {
      let newUrl = url.replace('music.youtube.com', 'www.youtube.com');
      let get = await client.getFromURL(newUrl, 'vi');
      let getsize = get.linksAudio.get('mp3128' ? 'mp3128' : '140').size
      let size = Math.floor(getsize.replace(' MB', ''))
      if (size > 49) {
        return bot.editMessageText('Fayl hajmi 50 MB dan ortiq, botlarni faqat 50 MB dan kam yuklab olish mumkin.', { chat_id: chatId, message_id: load.message_id })
      }
      let fname = filterAlphanumericWithDash(get.title) + '.mp3';
      let get2 = await get.linksAudio.get('mp3128' ? 'mp3128' : '140').fetch();
      await bot.editMessageText(`Musiqa yuklanmoqda ${get.title}, Iltimos kuting.`, { chat_id: chatId, message_id: load.message_id })
      let buff = await getBuffer(get2.downloadLink);
      fs.writeFileSync('content/' + fname, buff);
      await bot.sendChatAction(chatId, 'record_audio')
      await bot.sendAudio(chatId, 'content/' + fname, { caption: 'Muvaffaqiyatli musiqa yuklab olindi ' + get.title })
      await bot.deleteMessage(chatId, load.message_id);
      fs.unlinkSync('content/' + fname)
    } else {
      let data = [];
      let get = await client.getFromURL(url, 'vi');
      for (let [ind, args] of get.linksVideo) {
        let title = htmlToText(args.name);
        data.push([{ text: `Video ${title}${args.size ? ' - ' + args.size : ''}`, callback_data: `ytv ${get.videoId} ${ind}` }])
      }
      for (let [ind, args] of get.linksAudio) {
        let title = htmlToText(args.name);
        data.push([{ text: `Audio ${title}${args.size ? ' - ' + args.size : ''}`, callback_data: `yta ${get.videoId} ${ind}` }])
      }
      let options = {
        caption: `${get.title}\n\nIltimos, quyidagi variantni tanlang!`,
        reply_markup: JSON.stringify({
          inline_keyboard: data
        })
      }
      await bot.sendChatAction(chatId, 'upload_photo')
      await bot.sendPhoto(chatId, `https://i.ytimg.com/vi/${get.videoId}/0.jpg`, options)
      await bot.deleteMessage(chatId, load.message_id);
    }
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/youtube.js\n Function: getYoutube()\n \n\n${err}`.trim());
    return bot.editMessageText('Xatolik yuz berdi,YouTube havolangiz togri ekanligiga ishonch hosil qiling!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function getYoutubeVideo(bot, chatId, id, ind, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.')
  try {
    let get = await client.getFromURL('https://www.youtube.com/' + id, 'vi');
    let res = await get.linksVideo.get(ind).fetch();
    let getsize = get.linksVideo.get(ind).size;
    let size = Math.floor(getsize.replace(' MB', ''));
    if (size > 49) {
      return bot.editMessageText('Fayl hajmi 50 mb dan ortiq, bot faqat 50 mb dan kichik fayllarni yuklab olishi mumkin, iltimos uni quyidagi havola orqali brauzeringizga yuklab oling\n\n' + res.downloadLink, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true })
    }
    let fname = filterAlphanumericWithDash(res.title) + '.mp4';
    await bot.editMessageText('Loading, downloading video ' + get.title, { chat_id: chatId, message_id: load.message_id });
    let buff = await getBuffer(res.downloadLink);
    fs.writeFileSync('content/' + fname, buff);
    bot.sendChatAction(chatId, 'upload_video')
    bot.sendVideo(chatId, 'content/' + fname, { caption: res.title });
    await bot.deleteMessage(chatId, load.message_id);
    fs.unlinkSync('content/' + fname);
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/youtube.js\n Function: getYoutubeVideo()\n Url: https://www.youtube.com/${id}\n\n${err}`.trim());
    return bot.editMessageText('Xatolik yuz berdi, videoni yuklab bolmadi!', { chat_id: chatId, message_id: load.message_id })
  }
}

async function getYoutubeAudio(bot, chatId, id, ind, userName) {
  let load = await bot.sendMessage(chatId, 'Yuklanmoqda, kuting.')
  try {
    let get = await client.getFromURL('https://www.youtube.com/' + id, 'vi');
    let res = await get.linksAudio.get(ind).fetch();
    let getsize = get.linksAudio.get(ind).size;
    let size = Math.floor(getsize.replace(' MB', ''));
    if (size > 49) {
      return bot.editMessageText('fayl hajmi 50 mb dan ortiq, bot faqat 50 mb dan kichik fayllarni yuklab olishi mumkin, iltimos uni quyidagi havola orqali brauzeringizdan yuklab oling\n\n' + res.downloadLink, { chat_id: chatId, message_id: load.message_id, disable_web_page_preview: true })
    }
    let fname = filterAlphanumericWithDash(res.title) + '.mp3';
    await bot.editMessageText('Yuklanmoqda, audio yuklab olinmoqda ' + get.title, { chat_id: chatId, message_id: load.message_id });
    let buff = await getBuffer(res.downloadLink);
    fs.writeFileSync('content/' + fname, buff);
    await bot.sendChatAction(chatId, 'record_audio')
    await bot.sendAudio(chatId, 'content/' + fname, { caption: res.title });
    await bot.deleteMessage(chatId, load.message_id);
    fs.unlinkSync('content/' + fname);
  } catch (err) {
    await bot.sendMessage(String(process.env.DEV_ID), `[ XATO XABAR ]\n\n Username: @${userName}\n File: funcs/youtube.js\n Function: getYoutubeAudio()\n Url: https://www.youtube.com/${id}\n\n${err}`.trim());
    return bot.editMessageText('Xatolik yuz berdi, audio yuklab olinmadi!', { chat_id: chatId, message_id: load.message_id })
  }
}
module.exports = {
  getYoutube,
  getYoutubeVideo,
  getYoutubeAudio
}