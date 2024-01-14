import $ from 'jquery';
import { NamedPage, request } from 'vj/api';

const page = new NamedPage('homepage', async () => {
  $('#getCard').on('click', () => {
    request.post('/', {
      operation: 'get_card',
    }).then((res) => {
      const videoHtml = document.createElement('video');
      videoHtml.id = 'animation';
      videoHtml.src = 'https://img.zshfoj.com/Cards/cardAnimation.mp4';
      videoHtml.autoplay = true;
      videoHtml.style.maxWidth = '100%';
      $('#getCard').replaceWith(videoHtml);
      setInterval(() => {
        $('#animation').replaceWith(res.html);
      }, 6820);
    });
  });
});

export default page;
