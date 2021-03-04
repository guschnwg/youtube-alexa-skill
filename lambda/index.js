/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const AWS = require("aws-sdk");

const YouTube = require('./youtube');
const Util = require('./util');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome, you can say Hello or Help. Which would you like to try?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SampleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SampleIntent';
    },
    async handle(handlerInput) {
        const query = "ABOVE AND BEYOND ACOUSTIC";

        const songs = await YouTube.getYoutubeSongsFromAlbum(query);
        if (songs.length === 0) return Util.getNoResultsResponse(handlerInput, query);

        let persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        persistentAttributes = { liked: [], ...persistentAttributes, songs, current: 0, played: [0], shuffle: false, query };
        await Util.savePersistentAttributes(handlerInput, persistentAttributes);

        const url = await YouTube.getSongURL(songs[0].videoId);
        return Util.getReplaceAllResponse(handlerInput, songs[0], url);
    }
};

const LikedIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LikedIntent';
    },
    async handle(handlerInput) {
        const query = "lista de curtidas";

        let persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

        const songs = persistentAttributes.liked;
        if (songs.length === 0) return Util.getNoResultsResponse(handlerInput, query);
        
        persistentAttributes = { liked: [], ...persistentAttributes, songs, current: 0, played: [0], shuffle: false, query };
        await Util.savePersistentAttributes(handlerInput, persistentAttributes);

        const url = await YouTube.getSongURL(songs[0].videoId);
        return Util.getReplaceAllResponse(handlerInput, songs[0], url);
    }
};

const PlaylistGenreIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlaylistGenreIntent';
    },
    async handle(handlerInput) {
        const query = Alexa.getSlotValue(handlerInput.requestEnvelope, "playlist")
            || Alexa.getSlotValue(handlerInput.requestEnvelope, "genre");

        const songs = await YouTube.getYoutubeSongsFromPlaylist(query);
        if (songs.length === 0) return Util.getNoResultsResponse(handlerInput, query);

        let persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        persistentAttributes = { liked: [], ...persistentAttributes, songs, current: 0, played: [0], shuffle: false, query };
        await Util.savePersistentAttributes(handlerInput, persistentAttributes);

        const url = await YouTube.getSongURL(songs[0].videoId);
        return Util.getReplaceAllResponse(handlerInput, songs[0], url);
    }
}

const SpecificSongIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SpecificSongIntent';
    },
    async handle(handlerInput) {
        const query = Alexa.getSlotValue(handlerInput.requestEnvelope, "song");

        const songs = await YouTube.getYoutubeSongFromName(query);
        if (songs.length === 0) return Util.getNoResultsResponse(handlerInput, query);

        let persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        persistentAttributes = { liked: [], ...persistentAttributes, songs, current: 0, played: [0], shuffle: false, query };
        await Util.savePersistentAttributes(handlerInput, persistentAttributes);

        const url = await YouTube.getSongURL(songs[0].videoId);
        return Util.getReplaceAllResponse(handlerInput, songs[0], url);
    }
}

const AudioPlayerInterfaceHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope).startsWith("AudioPlayer.");
    },
    async handle(handlerInput) {
        if (Alexa.getRequestType(handlerInput.requestEnvelope) === "AudioPlayer.PlaybackNearlyFinished") {
            const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
            const currentToken = persistentAttributes.songs[persistentAttributes.current].videoId;
            persistentAttributes.current = Util.getNextSongIndex(persistentAttributes);

            if (persistentAttributes.current === -1) return Util.getStopPlayingResponse(handlerInput);

            persistentAttributes.played = [...persistentAttributes.played, persistentAttributes.current];
            await Util.savePersistentAttributes(handlerInput, persistentAttributes);
            
            const song = persistentAttributes.songs[persistentAttributes.current];
            const url = await YouTube.getSongURL(song.videoId);
            return Util.getEnqueueResponse(handlerInput, song, url, currentToken);
        }
        

        // Gotta work on this        
        // if (Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackFailed') {
        //     const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        //     persistentAttributes.current = Util.getNextSongIndex(persistentAttributes);
    
        //     if (persistentAttributes.current === -1) return Util.getStopPlayingResponse(handlerInput);
    
        //     persistentAttributes.played = [...persistentAttributes.played, persistentAttributes.current];
        //     await Util.savePersistentAttributes(handlerInput, persistentAttributes);
            
        //     const song = persistentAttributes.songs[persistentAttributes.current];
        //     const url = await YouTube.getSongURL(song.videoId);
        //     return Util.getQuietReplaceAllResponse(handlerInput, song, url);
        // }

        return handlerInput.responseBuilder.getResponse();
    }
};

const NextIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NextIntent';
    },
    async handle(handlerInput) {
        const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        persistentAttributes.current = Util.getNextSongIndex(persistentAttributes);

        if (persistentAttributes.current === -1) return Util.getStopPlayingResponse(handlerInput);

        persistentAttributes.played = [...persistentAttributes.played, persistentAttributes.current];
        await Util.savePersistentAttributes(handlerInput, persistentAttributes);
        
        const song = persistentAttributes.songs[persistentAttributes.current];
        const url = await YouTube.getSongURL(song.videoId);
        return Util.getReplaceAllResponse(handlerInput, song, url);
    }
};


const ShuffleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ShuffleOnIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ShuffleOffIntent');
    },
    async handle(handlerInput) {
        const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        persistentAttributes.shuffle = Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ShuffleOnIntent';
        await Util.savePersistentAttributes(handlerInput, persistentAttributes);

        return handlerInput.responseBuilder.withShouldEndSession(true).getResponse();
    }
};

const LikeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent';
    },
    async handle(handlerInput) {
        const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        const current = persistentAttributes.songs[persistentAttributes.current];
        if (!persistentAttributes.liked.some(song => song.videoId === current.videoId)) {
            persistentAttributes.liked = [
                ...(persistentAttributes.liked || []),
                current,
            ]
        }
        await Util.savePersistentAttributes(handlerInput, persistentAttributes);

        return handlerInput.responseBuilder.getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PauseIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return Util.getStopPlayingResponse(handlerInput, speakOutput);
    }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);
        console.log(`~~~~ Error handled: ${error}`);
        console.log("handlerInput", JSON.stringify(handlerInput, null, 2));

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


function getPersistenceAdapter() {
  // Determines persistence adapter to be used based on environment
  const dynamoDBAdapter = require("ask-sdk-dynamodb-persistence-adapter");
  return new dynamoDBAdapter.DynamoDbPersistenceAdapter({
    tableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
    createTable: false,
    dynamoDBClient: new AWS.DynamoDB({ apiVersion: "latest", region: process.env.DYNAMODB_PERSISTENCE_REGION }),
  });
}


/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(getPersistenceAdapter())
    .addRequestHandlers(
        AudioPlayerInterfaceHandler,

        LaunchRequestHandler,
        SpecificSongIntentHandler,
        SampleIntentHandler,
        LikedIntentHandler,
        PlaylistGenreIntentHandler,
        NextIntentHandler,
        ShuffleIntentHandler,
        LikeIntentHandler,

        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();