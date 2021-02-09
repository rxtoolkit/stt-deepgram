import {expect} from 'chai';
// import sinon from 'sinon';
// import {marbles} from 'rxjs-marbles/mocha';

import {toDeepgram} from './index';

describe('index', () => {
  it('should export a function', () => {
    expect(toDeepgram).to.be.a('function');
  });
});
