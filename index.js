"use strict";

const fs = require('fs');
const fsPromises = fs.promises;
const http = require('https');
const vk = require('vk-dirty-api');

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

function pDownload(url, dest){
  // https://stackoverflow.com/a/34524711
  var file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    var responseSent = false; // flag to make sure that response is sent only once.
    http.get(url, response => {
      response.pipe(file);
      file.on('finish', () =>{
        file.close(() => {
          if(responseSent)  return;
          responseSent = true;
          resolve();
        });
      });
    }).on('error', err => {
        if(responseSent)  return;
        responseSent = true;
        reject(err);
    });
  });
}

function getAttachments(post) {
  if (post.attachments) {
    return post.attachments;
  }

  if (post.copy_history) {
    for (const copy of post.copy_history) {
      const attachments = getAttachments(copy);
      if (attachments) {
        return attachments;
      }
    }
  }

  return null;
}

function sleep(ms) {
  // https://www.stackoverflow.com/questions/951021
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async (token) => {
  const api = vk.api(token);

  /**
   * Request current account info
   */
  const info = await api('account.getInfo', { fields: 'country' });
  console.log(info);

  let offset = 0;
  while (true) {
    const wall = await api('wall.get', {
      count: 100,
      offset: offset,
      filter: 'all',
      extended: 1
    });

    if (!(wall.items || []).length) {
      break;
    }

    for (const post of wall.items) {
      console.log(post.text);

      await sleep(1100);

      const comments = await api('wall.getComments', {
        'post_id': post.id,
        'need_likes': 1,
        count: 100,
        'preview_length': 0,
        extended: 1,
      });

      for (const comment of comments.items) {
        console.log('----> ' + comment.text);
      }

      await fsPromises.writeFile(`data/post_${post.owner_id}_${post.id}.json`, JSON.stringify({ post: post, comments: comments }));

      let containsUnsupportedAttachments = false;
      let isRepost = false;
      let i = 0;
      for (const attachment of getAttachments(post) || []) {
        if (attachment.type === 'photo' || attachment.type === 'posted_photo') {
          const photo = attachment.photo || attachment.posted_photo;
          const src = photo.photo_2560 || photo.photo_1280 || photo.photo_807 || photo.photo_604 || photo.photo_130 || photo.photo_75;
          if (src) {
            const extension = /\.\w+$/.exec(src)[0];
            var request = await pDownload(src, `data/post_${post.owner_id}_${post.id}.${i}${extension}`);
            console.log(`Downloaded ${src} to data/post_${post.owner_id}_${post.id}.${i}${extension}`);
          } else {
            containsUnsupportedAttachments = true;
          }
        } else if (attachment.type === 'video' || attachment.type === 'audio' || attachment.type === 'album') {
        } else if (attachment.type === 'link' || attachment.type === 'page') {
          isRepost = true;
        } else {
          containsUnsupportedAttachments = true;
          console.log(`Unsupported attachment type: ${attachment.type}`);
        }

        i++;
      }

      if ((isRepost || (!containsUnsupportedAttachments && !post.text)) && comments.items.length < 50) {
        await api('wall.delete', {
          'post_id': post.id
        });

        console.log('deleted');
      } else {
        offset += 1;
      }
    }
  }
})("0123456789abcdef"); //your token goes here
