const SpotifyWebApi = require('spotify-web-api-node');
const db = require('./db');
const express = require('express');
const app = express();
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { create } = require('hbs');

const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
  ];

// req : empty
// res : { redirect : URL }
exports.login = (req, res) => {
    res.json({ redirect: spotifyApi.createAuthorizeURL(scopes) });
}

// Spotify callback to either create user or update tokens
exports.callback = async (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;
    
    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }
    
    spotifyApi
        .authorizationCodeGrant(code)
        .then(data  => {
        const { access_token, refresh_token, expires_in } = data.body;
    
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);

        console.log(
            `Sucessfully retreived access token. Expires in ${expires_in} s.`
        );

        return spotifyApi.getMe();
        })
        .then(data => {
            var accessToken = spotifyApi.getAccessToken();
            var refreshToken = spotifyApi.getRefreshToken();

            let { id, email } = data.body;

            db.query('INSERT INTO user (userID, email, accessToken, refreshToken) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE accessToken = ?, refreshToken = ?;', [id, email, accessToken, refreshToken, accessToken, refreshToken],
            (error, result) => {
                if(error){
                    console.log(error);
                } else {
                    console.log(result);
                }
            });
            res.redirect(200, `http://localhost:3000/?username=${id}`);
            return;
        })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.send(`Error getting Tokens: ${error}`);
            return;
        });
}

// req : { accessToken: string }
// success res : Spotify info JSON
// failure res : { error : error }
exports.getMe = async (req, res) => {
    spotifyApi.setAccessToken(req.body.accessToken);
    await spotifyApi.getMe()
        .then((data) => {
            console.log(data.body);
            res.send(data);
        })
        .catch((error) => {
            console.log("Error: " + error.message);
            res.json({ error: error });
    });
}

// req : { accessToken: string }
// res : { playlists: array of IDs }
exports.getUserPlaylists = async (req, res) => {
    spotifyApi.setAccessToken(req.body.accessToken);
    await spotifyApi.getMe()
    .then(data => {
        spotifyApi.getUserPlaylists(data.body['id'])
        .then(data => {
        let playlists = []

        for (let playlist of data.body.items) {
            playlists.push(playlist.id);
        }

        console.log(playlists);
        res.json({ "playlists" : playlists });
        })
    })
    .catch((error) => {
        console.log(error);
    });
}

// req : { accessToken: string, refreshToken: string }
// success res : { userID: string, message: string }
// failure res : { message: error, redirect: URL }
exports.refreshUserTokens = async (req, res) => {
    var { accessToken, refreshToken } = req.body;
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    spotifyApi.refreshAccessToken()
    .then(data => {
        spotifyApi.setAccessToken(data.body['access_token']);
        db.query("UPDATE user SET accessToken = ? WHERE userId = ?", [data.body['access_token'], req.body['userID']]);
        res.json({ message: "Refresh success" });
    }).catch(error => {
        res.json({ message: error, redirect: spotifyApi.createAuthorizeURL(scopes) });
    });
}

// req : { accessToken: string, refreshToken: string, query : string }
// success res : { ? }
exports.search = async (req, res) => {
    var { accessToken, refreshToken } = req.body;
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
    let types = ['album', 'artist', 'playlist', 'track', 'show', 'episode'];
    let limits = { limit : 5, offset : 1 };
    console.log(req.body);

    spotifyApi.search(req.body['query'], types, limits)
    .then(data => {
        res.json({ result: data.body });
    }).catch(error => {
        res.json({ message: error});
    });
}

//module.exports = spotifyApi;