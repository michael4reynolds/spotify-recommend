const fetch = require('node-fetch')
const express = require('express')
const path = require('path')

const app = express()

// API Functions

const getFromApi = (endpoint) => {
  return fetch(`https://api.spotify.com/v1/${endpoint}`)
    .then(response => response.json())
}

const getArtist = (name) => {
  return getFromApi('search?q=name&limit=1&type=artist')
    .then(response => response.artists.items[0])
}

const getRelatedArtists = (artist) => {
  return getFromApi(`artists/${artist.id}/related-artists`)
    .then(response => {
      artist.related = response.artists
      return artist
    })
}

const getTopTracks = (mainArtist) => {
  var promises = mainArtist.related
    .map(function (artist) {
      return getFromApi(`artists/${artist.id}/top-tracks?country=us`)
        .then(topTracks => {
          artist.tracks = topTracks.tracks
          return artist
        })
    })
  return Promise.all(promises).then(() => mainArtist)
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
