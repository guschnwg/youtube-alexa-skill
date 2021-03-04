const AWS = require('aws-sdk');

const s3SigV4Client = new AWS.S3({
    signatureVersion: 'v4',
    region: process.env.S3_PERSISTENCE_REGION
});

function getS3PreSignedUrl(s3ObjectKey) {
    const bucketName = process.env.S3_PERSISTENCE_BUCKET;
    const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: s3ObjectKey,
        Expires: 60*1 // the Expires is capped for 1 minute
    });
    console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
    return s3PreSignedUrl;

}

function getNoResultsResponse(handlerInput, query) {
    return handlerInput.responseBuilder
        .speak("Nada encontrado para " + query + ". Tente novamente.")
        .reprompt()
        .getResponse();
}

function getReplaceAllResponse(handlerInput, song, url) {
    return handlerInput.responseBuilder
            .speak("Começando " + song.title)
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, song.videoId, 0)
            .withShouldEndSession(true)
            .getResponse();
}

function getQuietReplaceAllResponse(handlerInput, song, url) {
    return handlerInput.responseBuilder
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, song.videoId, 0)
            .withShouldEndSession(true)
            .getResponse();
}

function getEnqueueResponse(handlerInput, song, url, currentToken) {
    return handlerInput.responseBuilder
            .addAudioPlayerPlayDirective('ENQUEUE', url, song.videoId, 0, currentToken)
            .withShouldEndSession(true)
            .getResponse();
}

function getStopPlayingResponse(handlerInput, speakOutput = "") {
    if (!speakOutput) {
        speakOutput = "Esta lista de músicas chegou ao fim."
    }
    
    return handlerInput.responseBuilder
        .speak(speakOutput)
        .addAudioPlayerStopDirective()
        .getResponse();
}

async function savePersistentAttributes(handlerInput, persistentAttributes) {
    handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
    await handlerInput.attributesManager.savePersistentAttributes(persistentAttributes);
}

function getNextSongIndex(persistentAttributes) {
    if (persistentAttributes.played.length === persistentAttributes.songs.length) {
        return -1;
    }
    
    if (persistentAttributes.shuffle) {
        // Need to generate some index that was NOT played
        let index = parseInt(Math.random() * persistentAttributes.songs.length);
        while (persistentAttributes.played.includes(index)) {
            index = parseInt(Math.random() * persistentAttributes.songs.length);
        }
        return index;
    }

    return persistentAttributes.current + 1;
}


module.exports = {
    getS3PreSignedUrl,
    getNoResultsResponse,
    getReplaceAllResponse,
    getQuietReplaceAllResponse,
    getEnqueueResponse,
    savePersistentAttributes,
    getNextSongIndex,
    getStopPlayingResponse,
}

