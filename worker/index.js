export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === 'www.aijoylab.kr') {
      url.protocol = 'https:';
      url.hostname = 'aijoylab.kr';
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  }
};
