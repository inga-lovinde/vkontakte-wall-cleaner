# vkontakte-wall-cleaner
Back up your wall contents, and remove potentially offending posts

Content warning: the code is of extremely poor quality, it was written in an hour, and not intended to be reused.

Usage:

1. `npm install`
2. Create new stand-alone VK app on https://vk.com/apps?act=manage , remember its client_id.
3. Create your token on https://oauth.vk.com/authorize?client_id=CLIENT_ID&redirect_uri=https://oauth.vk.com/blank.html&display=page&scope=8192&response_type=token&v=5.80 , where CLIENT_ID is app id from the previous step (8192 means that script will have access to wall only).
4. Edit `index.js`, substituting token placeholder for your token.
5. `node index`

All posts are backed up, along with their photo attachments and up to 100 comments per post.

All reposts, and all photo/album/video/audio posts without text are removed, except for those that have over 50 comments. The behaviour can be tweaked in line 123.
