import unirest from 'unirest'
import express from 'express'
import events from 'events'

const getFromApi = (endpoint, args) => {
  const emitter = new events.EventEmitter()
  unirest.get(`https://api.spotify.com/v1/${endpoint}`)
    .qs(args)
    .end(response => {
      if (response.ok) {
        emitter.emit('end', response.body)
      } else {
        emitter.emit('error', response.code)
      }
    })
  return emitter
}

const app = express()
app.use(express.static('public'))

app.get('/search/:name', (req, res) => {
  const searchReq = getFromApi('search', {
    q: req.params.name,
    limit: 1,
    type: 'artist'
  })

  searchReq.on('end', item => {
    const artist = item.artists.items[0]
    res.json(artist)
  })

  searchReq.on('error', code => {
    res.sendStatus(code)
  })
})

app.listen(8000)
