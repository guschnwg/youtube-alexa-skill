const Axios = require('axios').default;
const YoutubeMusicApi = require("youtube-music-api");
const ytdl = require('ytdl-core');

// Add here your HerokuApp url, if you need proxy to make sure the songs work for you
// See notes in getSongURLFromHeroku and getSongURLFromYTDL
const BASE_URL = "https://youtube-dl-alexa.herokuapp.com/youtube/url?url=";
// const BASE_URL = "";

const PREFIX = "https://music.youtube.com/watch?v=";
const GET_URL = BASE_URL + PREFIX;

async function getYoutubeSongsFromPlaylist(playlistName) {
  const api = new YoutubeMusicApi();
  await api.initalize();
  const playlists = await api.search(playlistName, "playlist").then((res) => res.content);
  const songs = await api.getSongs(playlists[0].browseId);
  return songs;
}

async function getYoutubeSongsFromAlbum(albumName) {
  const api = new YoutubeMusicApi();
  await api.initalize();
  const albums = await api.search(albumName, "album").then((res) => res.content);
  const album = await api.getAlbum(albums[0].browseId);
  return album.tracks;
}

async function getYoutubeSongFromName(songName = "Boris Brejcha Purple Noise") {
  const api = new YoutubeMusicApi();
  await api.initalize();
  const songs = await api.search(songName, "song").then(res => res.content);
  const song = songs[0];
  const next = await api.getNext(song.videoId, song.playlistId, "").then(res => res.content);
  return next;
}

async function getSongURL(videoId) {
    if (BASE_URL) {
        return getSongURLFromHeroku(videoId);
    }
    return getSongURLFromYTDL(videoId);
}

// This returns a stream URL with a proxy in the heroku app
// This solves the problem below
async function getSongURLFromHeroku(videoId) {
    const res = await Axios.get(GET_URL + videoId);
    const url = res.data.results.proxy;
    return url;
}

// This has an issue when your geolocation don't have access to the video
// As this fetches info from the Lambda function location, this is not always the same catalog as yours
// and when you play the song locally you fetches from your location

// Example:
// - you request a song called X by Y
// - the lambda function, let's say, are in the US, so it fetches the stream URL for the song in the US
// - when I send you the stream URL, you are in a different location, let's say Europe, then the same stream URL is not valid for you

// You won't have this issue if the lambda function you are querying matches your current geolocation, but this is not everyones case
// and also not my case, so that's why we have heroku above

async function getSongURLFromYTDL(videoId) {
    const info = await ytdl.getInfo(PREFIX + videoId)
    const format = info.formats.find(f => f.mimeType.includes("audio/mp4"));
    return format.url;
}

module.exports = {
    getYoutubeSongsFromPlaylist,
    getYoutubeSongsFromAlbum,
    getYoutubeSongFromName,
    getSongURL,
}