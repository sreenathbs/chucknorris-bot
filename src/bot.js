const recastai = require('recastai').default
const client = new recastai(process.env.REQUEST_TOKEN)
const request = require('request')

let res = null;

const replyMessage = (message, text) => {
  const recastaiReq = new recastai.request(process.env.REQUEST_TOKEN, process.env.LANGUAGE)
  const content = (message ? message.content : text)

  recastaiReq.analyseText(content)
  .then(recastaiRes => {
    if (recastaiRes.entities.hasOwnProperty('category')) {
      request('https://api.chucknorris.io/jokes/categories', (_err, _res, body) => {
        let response = JSON.parse(body)
        let category = recastaiRes.entities.category[0].value
        if (response.indexOf(category)) {
          request(`https://api.chucknorris.io/jokes/random?category=${category}`, (_err, _res, body) => {
            body = JSON.parse(body)
            
            let reply = {
              reply: body.value
            }

            if (message) {
              message.reply(reply)
            } else {
              res.send(reply)
            }
          })
        } else {
          request('https://api.chucknorris.io/jokes/categories', (_err, _res, body) => {
            body = JSON.parse(body)

            let reply = {
              reply: `Sorry, I only know about these categories: ${body.join(', ')}.`
            }

            if (message) {
              message.reply(reply)
            } else {
              res.send(reply)
            }
          })
        }
      })
    } else {
      request('https://api.chucknorris.io/jokes/random', (_err, _res, body) => {
          body = JSON.parse(body)

          let reply = {
            reply: body.value
          }

          if (message) {
            message.reply(reply)
          } else {
            res.send(reply)
          }
      })
    }
  })
}


export const bot = (body, response, callback) => {
  res = response
  console.log(body);
  if (body.message) {
    client.connect.handleMessage({ body }, response, replyMessage)
    callback(null, { result: 'Bot answered :)' })
  } else if (body.text) {
    replyMessage(null, body.text)
  } else {
    callback('No text provided')
  }
}
