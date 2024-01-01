import qs from 'qs';
import {concat,of,throwError} from 'rxjs';
import {conduit} from '@rxtk/ws';

import shortenChunks from './internals/shortenChunks';

const errors = {
  requiredParams: () => new Error('toDeepgram operator requires username and password'),
};

const getAuthProtocol = ({username, password}) => {
  const base64Auth = Buffer.from(`${username}:${password}`).toString('base64');
  return ['Basic', base64Auth];
};

const getFullUrl = ({
  url,
  encoding,
  channels,
  sampleRate,
  useInterimResults,
  useSpeakerLabels,
  usePunctuation
}) => {
  const queryString = qs.stringify({
    encoding,
    channels,
    sample_rate: sampleRate,
    interim_results: useInterimResults,
    punctuation: usePunctuation,
    diarize: useSpeakerLabels,
  });
  return `${url}?${queryString}`;
};

// https://deepgram.com/docs#real-time-speech-recognition
const toDeepgram = ({
  username = process.env.DEEPGRAM_USERNAME, // can be set as environment var
  password = process.env.DEEPGRAM_PASSWORD, // can be set as environment var
  encoding = 'linear16', // linear16 means raw PCM audio (as 16-bit integers)
  channels = 1, // number of audio channels
  sampleRate = 16000, // sample rate of audio data
  useInterimResults = true, // get interim results
  usePunctuation = true,
  useSpeakerLabels = true,
  url = 'wss://brain.deepgram.com/v2/listen/stream',
} = {}) => {
  if (!username || !password) return () => throwError(errors.requiredParams());
  return audioChunk$ => {
    const lastMessage$ = of(new Uint8Array(0));
    // const shortenedChunk$ = audioChunk$.pipe(shortenChunks(1000));
    // const messageIn$ = concat(shortenedChunk$, of(lastMessage));
    const messageOut$ = concat(audioChunk$, lastMessage$).pipe(
      conduit({
        url: getFullUrl({
          url,
          encoding,
          channels,
          sampleRate,
          useInterimResults,
          useSpeakerLabels,
          usePunctuation,
        }),
        protocols: getAuthProtocol({username, password}),
        serializer: chunk => chunk, // Do not serialize input data as JSON
        deserializer: message => JSON.parse(message), // serialize output
      })
    );
    let wordOut$ = messageOut$;
    wordOut$.error$ = messageOut$.error$;
    return wordOut$;
  };
};

export default toDeepgram;
