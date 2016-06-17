const unirest = require('unirest')
const express = require('express')
const path = require('path')

const app = express()

// API Functions

const getFromApi = (endpoint, args) => {
  return new Promise((resolve, reject) => {
    unirest.get(`https://api.spotify.com/v1/${endpoint}`)
      .qs(args)
      .end(response => {
        if (response.ok) {
          resolve(response.body)
        } else {
          reject('error', response.code)
        }
      })
  })
}

const getArtist = (name) => {
  return getFromApi('search', {q: name, limit: 1, type: 'artist'})
    .then(response => response.artists.items[0], handleError)
}

const getRelatedArtists = (artist) => {
  return getFromApi(`artists/${artist.id}/related-artists`)
    .then(response => {
      artist.related = response.artists
      return artist
    }, handleError)
}

const getTopTracks = (mainArtist) => {
  var promises = mainArtist.related
    .map(function (artist) {
      return getFromApi(`artists/${artist.id}/top-tracks`, {country: 'us'})
        .then(topTracks => {
          artist.tracks = topTracks.tracks
          return artist
        }, handleError)
    })
  return Promise.all(promises).then(() => mainArtist, handleError)
}

const sendResults = (res) => {
  return artists => res.json(artists)
}

const handleError = () => {
  return err => console.log(err)
}

// Routes

app.use(express.static(path.join(__dirname, '../public')));

app.get('/search/:name', (req, res) => {
  getArtist(req.params.name)
    .then(getRelatedArtists)
    .then(getTopTracks)
    .then(sendResults(res))
    .catch(handleError)
})

app.listen(8000)
