const recastai = require('recastai').default
const client = new recastai(process.env.REQUEST_TOKEN)
const request = require('request')

const replyMessage = (message, text, res) => {
  const recastaiReq = new recastai.request(process.env.REQUEST_TOKEN, process.env.LANGUAGE)
  const content = (message ? message.content : text)

  recastaiReq.analyseText(content)
    .then(recastaiRes => {
      const intent = recastaiRes.intent()
      console.log(intent)

      if (intent && intent.slug === 'greetings') {
        const reply = {
          type: 'quickReplies',
          content: {
            title: 'Hi! What can I do for you?',
            buttons: [
              {
                title: 'Chuck Norris fact',
                value: 'Tell me a joke',
              },
              {
                title: 'Goodbye',
                value: 'Goodbye',
              },
            ],
          },
        }

        return message ? message.reply([reply]) : res.json({ reply: 'Hi, what can I do for you? :-)' })
      }

      if (recastaiRes.entities.hasOwnProperty('category')) {
        request('https://api.chucknorris.io/jokes/categories', (_err, _res, body) => {
          const response = JSON.parse(body)
          const category = recastaiRes.entities.category[0].value
          if (response.indexOf(category)) {
            request(`https://api.chucknorris.io/jokes/random?category=${category}`, (_err, _res, body) => {
              body = JSON.parse(body)
              const content = body.value

              return message ? message.reply([{ type: 'text', content }]).then() : res.send({ reply: content })
            })
          } else {
            request('https://api.chucknorris.io/jokes/categories', (_err, _res, body) => {
              body = JSON.parse(body)
              const content = `Sorry, I only know about these categories: ${body.join(', ')}.`

              return message ? message.reply([{ type: 'text', content }]).then() : res.send({ reply: content })
            })
          }
        })
      } else {
        request('https://api.chucknorris.io/jokes/random', (_err, _res, body) => {
          body = JSON.parse(body)
          const content = body.value

          return message ? message.reply({ type: 'text', content }).then() : res.send({ reply: content })
        })
      }
    })
}

export const bot = (body, response, callback) => {
  console.log(body)

  if (body.message) {
    client.connect.handleMessage({ body }, response, replyMessage)
    callback(null, { result: 'Bot answered :)' })
  } else if (body.text) {
    replyMessage(null, body.text, response)
  } else {
    callback('No text provided')
  }
}
