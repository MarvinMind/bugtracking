export default {
  async fetch(request, env) {
    return new Response('Hello from bugs2fixes!', {
      headers: { 'content-type': 'text/plain' }
    })
  }
}
